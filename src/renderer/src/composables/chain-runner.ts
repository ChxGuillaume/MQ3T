import {
  chainStepLabel,
  chainSteps,
  hasGeneratedUuid,
  mergedVariableSource,
  resolveActionVariables,
  VariableValue
} from '@renderer/components/tab-actions/action-utils'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { BusMessage, onMqttMessage } from './useMqttMessageBus'
import {
  matchesTopicFilter,
  messageMatches,
  readMessagePath,
  toVariableValue,
  conditionSubject,
  describeCondition,
  evaluateCondition
} from '@renderer/components/tab-actions/chain-message'
import { resolveNodeAction } from '@renderer/components/tab-actions/chain-node-action'
import {
  Action,
  ChainAction,
  ChainActionNode,
  ConditionNodeData,
  WaitMessageNodeData
} from '../../../types/actions'
import { Edge } from '@vue-flow/core'
import { IClientPublishOptions } from 'mqtt'

export type ChainRunLogState = 'done' | 'active' | 'pending' | 'stopped' | 'failed' | 'skipped'

export type ChainRunLogEntry = {
  id: string
  text: string
  state: ChainRunLogState
  time?: number
  reason?: string
  detail?: string
}

export type ChainRunOutcome = 'done' | 'stopped' | 'failed'

export type ChainNodeState = {
  isRunning?: boolean
  isFinished?: boolean
  isFailed?: boolean
  waitStartedAt?: number
  waitEndsAt?: number
}

export type ChainRunGraph = Pick<ChainAction, 'nodes' | 'edges' | 'repeat'>

export type RunContext = {
  connectionId: string
  variables: Map<string, VariableValue>
  lastMessage?: BusMessage
  iteration: number
  isStopped: () => boolean
  wait: (ms: number) => Promise<void>
  waitForMessage: (
    accepts: (message: BusMessage) => boolean,
    since: number,
    timeoutMs: number
  ) => Promise<BusMessage | undefined>
  setNodeState: (nodeId: string, state: ChainNodeState) => void
  setLogText: (nodeId: string, text: string) => void
  setLogDetail: (nodeId: string, detail: string) => void
  simulation?: ChainSimulation
}

export type StepInfo = { armedAt: number }

export type NodeExecutor = (
  node: ChainActionNode,
  context: RunContext,
  step: StepInfo
) => Promise<string | void>

export type ChainRunHooks = {
  onNodeState?: (nodeId: string, state: ChainNodeState) => void
  onLog?: (log: ChainRunLogEntry[]) => void
  onIteration?: (iteration: number, total: number) => void
}

export type ChainSimulation = {
  replyFor: (data: Partial<WaitMessageNodeData>) => string | undefined
}

export type ChainRunOptions = {
  simulate?: ChainSimulation
  variables?: Record<string, VariableValue>
}

export type ChainRun = {
  done: Promise<ChainRunOutcome>
  stop: () => void
  context: RunContext
}

export class ChainStepError extends Error {}

const resetNodeState: ChainNodeState = {
  isRunning: false,
  isFinished: false,
  isFailed: false,
  waitStartedAt: undefined,
  waitEndsAt: undefined
}

const stepLabel = (node: ChainActionNode) => {
  if (node.type === 'wait')
    return `Wait ${node.data?.duration || 0} ${node.data?.durationType || 'ms'}`
  if (node.type === 'wait-message') return `Wait for ${node.data?.topic || 'message'}`
  if (node.type === 'condition') return `If ${describeCondition(node.data ?? {})}`

  return chainStepLabel(node)
}

const SIMULATED_SEND_MS = 450
const SIMULATED_REPLY_MS = 900
const SIMULATED_MAX_WAIT_MS = 1500

const exampleTopic = (filter: string) =>
  filter
    .split('/')
    .map((level) => (level === '+' || level === '#' ? 'example' : level))
    .join('/')

const executeWait: NodeExecutor = async (node, context) => {
  if (node.type !== 'wait') return

  const duration = node.data?.duration || 500
  const durationType = node.data?.durationType || 'ms'
  const realMs = duration * (durationType === 's' ? 1000 : 1)
  const ms = context.simulation ? Math.min(realMs, SIMULATED_MAX_WAIT_MS) : realMs
  const startedAt = Date.now()

  context.setNodeState(node.id, { waitStartedAt: startedAt, waitEndsAt: startedAt + ms })
  context.setLogText(node.id, `Waiting ${duration} ${durationType}`)

  await context.wait(ms)
}

const executeAction: NodeExecutor = async (node, context) => {
  if (node.type !== 'action') return

  const { action, missing } = resolveNodeAction(node, context.connectionId)

  if (missing) throw new ChainStepError('The linked action no longer exists')
  if (!action) throw new ChainStepError('Step has no message')

  const options: IClientPublishOptions = { retain: action.retained, qos: action.qos }

  const isMqtt5 =
    useMqttConnectionsStore().getConnection(context.connectionId)?.protocolVersion === 5

  if (isMqtt5 && (action.responseTopic || action.correlationData)) {
    options.properties = {}

    if (action.responseTopic) options.properties.responseTopic = action.responseTopic
    if (action.correlationData) {
      options.properties.correlationData = action.correlationData as unknown as Buffer
    }
  }

  const { topic, payload } = resolveActionVariables(action, context.variables)

  context.setLogDetail(node.id, `${topic}  ${payload}`)

  if (context.simulation) {
    await context.wait(SIMULATED_SEND_MS)
    return
  }

  ElectronApi.sendMqttMessage(context.connectionId, topic, payload, options)
}

const MESSAGE_BUFFER_SIZE = 500

const executeWaitMessage: NodeExecutor = async (node, context, step) => {
  if (node.type !== 'wait-message') return

  const { topic, timeout, timeoutUnit, match, captures } = node.data ?? {}

  if (!topic) throw new ChainStepError('Step has no topic to listen on')

  const timeoutValue = timeout || 5
  const unit = timeoutUnit || 's'
  const timeoutMs = timeoutValue * (unit === 's' ? 1000 : 1)
  const startedAt = Date.now()

  context.setLogText(node.id, `Listening on ${topic}`)

  const accepts = (message: BusMessage) =>
    matchesTopicFilter(topic, message.topic) &&
    messageMatches(match ?? { kind: 'any' }, message.message)

  let received: BusMessage | undefined

  if (context.simulation) {
    const reply = context.simulation.replyFor(node.data ?? {})

    if (!reply) throw new ChainStepError('No simulated reply for this step')

    context.setNodeState(node.id, {
      waitStartedAt: startedAt,
      waitEndsAt: startedAt + SIMULATED_REPLY_MS
    })
    await context.wait(SIMULATED_REPLY_MS)

    received = {
      clientKey: context.connectionId,
      topic: exampleTopic(topic),
      message: reply,
      receivedAt: Date.now()
    }

    if (!accepts(received)) {
      context.setLogDetail(node.id, reply)
      throw new ChainStepError("The simulated reply doesn't pass this step's filter")
    }
  } else {
    context.setNodeState(node.id, { waitStartedAt: startedAt, waitEndsAt: startedAt + timeoutMs })

    received = await context.waitForMessage(accepts, step.armedAt, timeoutMs)
  }

  if (context.isStopped()) return
  if (!received) {
    throw new ChainStepError(`No matching message within ${timeoutValue} ${unit}`)
  }

  context.lastMessage = received
  context.setLogDetail(node.id, received.message)

  for (const capture of captures ?? []) {
    if (!capture.name) continue

    context.variables.set(
      capture.name,
      toVariableValue(readMessagePath(received.message, capture.path))
    )
  }
}

const executeCondition: NodeExecutor = async (node, context) => {
  if (node.type !== 'condition') return

  const condition: Partial<ConditionNodeData> = node.data ?? {}

  if (condition.source === 'message' && !context.lastMessage) {
    throw new ChainStepError('No message has been received yet')
  }

  const subject = conditionSubject(condition, context.variables, context.lastMessage?.message)

  context.setLogDetail(
    node.id,
    `value: ${subject === undefined ? 'missing' : JSON.stringify(subject)}`
  )

  return evaluateCondition(condition, subject) ? 'true' : 'false'
}

const doneText = (node: ChainActionNode, handle: string | void, simulated: boolean) => {
  if (node.type === 'condition') return `${stepLabel(node)} → ${handle}`
  if (node.type === 'action') return `${stepLabel(node)} ${simulated ? 'simulated' : 'sent'}`
  if (node.type === 'wait-message') return `Received on ${node.data?.topic ?? ''}`

  return stepLabel(node)
}

export const chainActions = (graph: ChainRunGraph, connectionId: string): Action[] =>
  chainSteps(graph).flatMap((node) => {
    const { action, missing } = resolveNodeAction(node, connectionId)

    return action && !missing ? [action] : []
  })

export const chainCapturedNames = (graph: ChainRunGraph) =>
  new Set(
    graph.nodes.flatMap((node) =>
      node.type === 'wait-message'
        ? (node.data?.captures ?? []).map((capture) => capture.name).filter(Boolean)
        : []
    )
  )

export const chainVariableSource = (graph: ChainRunGraph, connectionId: string) => {
  const actions = chainActions(graph, connectionId)
  const sources = actions.flatMap((action) => [
    action,
    { payload: action.topic, payloadFormat: 'raw' as const }
  ])

  return {
    source: mergedVariableSource(sources, chainCapturedNames(graph)),
    hasUuid: actions.some((action) => hasGeneratedUuid(action.payload))
  }
}

export const nodeExecutors: Partial<Record<string, NodeExecutor>> = {
  action: executeAction,
  wait: executeWait,
  'wait-message': executeWaitMessage,
  condition: executeCondition
}

export const runChain = (
  graph: ChainRunGraph,
  connectionId: string,
  hooks: ChainRunHooks = {},
  options: ChainRunOptions = {}
): ChainRun => {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]))
  const outgoing = new Map<string, Edge[]>()
  const pendingWaits = new Set<() => void>()
  const messageBuffer: BusMessage[] = []
  const messageListeners = new Set<(message: BusMessage) => void>()

  const unsubscribe = onMqttMessage((message) => {
    if (message.clientKey !== connectionId) return

    messageBuffer.push(message)
    if (messageBuffer.length > MESSAGE_BUFFER_SIZE) messageBuffer.shift()

    for (const listener of Array.from(messageListeners)) listener(message)
  })

  let stopped = false
  let failed = false

  for (const edge of graph.edges) {
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, [])

    outgoing.get(edge.source)!.push(edge)
  }

  const repeatCount = Math.max(0, Math.floor(graph.repeat?.count ?? 1))
  const repeatIntervalMs =
    (graph.repeat?.interval ?? 0) * (graph.repeat?.intervalUnit === 's' ? 1000 : 1)

  const iterationLabel = (iteration: number) => {
    if (repeatCount === 1) return 'Started'

    return repeatCount === 0 ? `Run ${iteration}` : `Run ${iteration} of ${repeatCount}`
  }

  const initialLog = (iteration: number): ChainRunLogEntry[] => [
    { id: 'start', text: iterationLabel(iteration), state: 'done', time: Date.now() },
    ...chainSteps(graph)
      .filter((node) => node.type !== 'start')
      .map((node) => ({ id: node.id, text: stepLabel(node), state: 'pending' as const }))
  ]

  let log = initialLog(1)

  const publishLog = () => hooks.onLog?.(log)

  const patchLog = (id: string, patch: Partial<ChainRunLogEntry>) => {
    log = log.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    publishLog()
  }

  const setNodeState = (nodeId: string, state: ChainNodeState) => hooks.onNodeState?.(nodeId, state)

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(timeout)
        pendingWaits.delete(finish)
        resolve()
      }
      const timeout = setTimeout(finish, ms)

      pendingWaits.add(finish)
    })

  const waitForMessage: RunContext['waitForMessage'] = (accepts, since, timeoutMs) => {
    const buffered = messageBuffer.find(
      (message) => message.receivedAt >= since && accepts(message)
    )

    if (buffered) return Promise.resolve(buffered)

    return new Promise((resolve) => {
      const finish = (message?: BusMessage) => {
        clearTimeout(timeout)
        pendingWaits.delete(cancel)
        messageListeners.delete(listener)
        resolve(message)
      }
      const cancel = () => finish()
      const listener = (message: BusMessage) => {
        if (accepts(message)) finish(message)
      }
      const timeout = setTimeout(cancel, timeoutMs)

      pendingWaits.add(cancel)
      messageListeners.add(listener)
    })
  }

  const context: RunContext = {
    connectionId,
    variables: new Map(Object.entries(options.variables ?? {})),
    iteration: 1,
    isStopped: () => stopped,
    wait,
    waitForMessage,
    setNodeState,
    setLogText: (nodeId, text) => patchLog(nodeId, { text }),
    setLogDetail: (nodeId, detail) => patchLog(nodeId, { detail }),
    simulation: options.simulate
  }

  const followEdges = async (nodeId: string, handle: string | void, armedAt: number) => {
    const edges = (outgoing.get(nodeId) ?? []).filter(
      (edge) => !handle || edge.sourceHandle === handle
    )

    await Promise.allSettled(
      edges.map(async (edge) => {
        const next = nodes.get(edge.target)

        if (next) await executeNode(next, armedAt)
      })
    )
  }

  const executeNode = async (node: ChainActionNode, armedAt: number): Promise<void> => {
    if (stopped) return

    setNodeState(node.id, { ...resetNodeState, isRunning: true })
    patchLog(node.id, { state: 'active', time: Date.now() })

    let handle: string | void

    try {
      handle = await nodeExecutors[node.type ?? '']?.(node, context, { armedAt })
    } catch (error) {
      if (stopped) return

      failed = true

      const reason = error instanceof Error ? error.message : String(error)

      setNodeState(node.id, { isRunning: false, isFailed: true })
      patchLog(node.id, {
        state: 'failed',
        time: Date.now(),
        reason,
        text: `${stepLabel(node)} failed`
      })
      return
    }

    if (stopped) return

    setNodeState(node.id, { isRunning: false, isFinished: true })
    patchLog(node.id, {
      state: 'done',
      time: Date.now(),
      text: doneText(node, handle, !!options.simulate)
    })

    await followEdges(node.id, handle, Date.now())
  }

  const runIteration = async (iteration: number) => {
    context.iteration = iteration
    log = initialLog(iteration)

    for (const node of graph.nodes) setNodeState(node.id, resetNodeState)

    hooks.onIteration?.(iteration, repeatCount)
    publishLog()

    await followEdges('start', undefined, Date.now())
  }

  const runIterations = async () => {
    for (let iteration = 1; repeatCount === 0 || iteration <= repeatCount; iteration++) {
      await runIteration(iteration)

      const isLast = repeatCount !== 0 && iteration >= repeatCount

      if (stopped || failed || isLast) return
      await wait(
        options.simulate ? Math.min(repeatIntervalMs, SIMULATED_MAX_WAIT_MS) : repeatIntervalMs
      )
      if (stopped) return
    }
  }

  const done = runIterations().then((): ChainRunOutcome => {
    unsubscribe()

    if (stopped) {
      log = log.map((entry) =>
        entry.state === 'active' || entry.state === 'pending'
          ? { ...entry, state: 'stopped' }
          : entry
      )
      publishLog()

      return 'stopped'
    }

    log = log.map((entry) => (entry.state === 'pending' ? { ...entry, state: 'skipped' } : entry))
    publishLog()

    return failed ? 'failed' : 'done'
  })

  const stop = () => {
    if (stopped) return

    stopped = true

    for (const finish of Array.from(pendingWaits)) finish()
  }

  return { done, stop, context }
}

export const clearNodeStates = (graph: ChainRunGraph, hooks: ChainRunHooks) => {
  for (const node of graph.nodes) hooks.onNodeState?.(node.id, resetNodeState)
}
