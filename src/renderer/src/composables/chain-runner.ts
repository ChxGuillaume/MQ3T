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
import { BusMessage } from './useMqttMessageBus'
import { Action, ChainAction, ChainActionNode } from '../../../types/actions'
import { Edge } from '@vue-flow/core'
import { IClientPublishOptions } from 'mqtt'

export type ChainRunLogState = 'done' | 'active' | 'pending' | 'stopped' | 'failed'

export type ChainRunLogEntry = {
  id: string
  text: string
  state: ChainRunLogState
  time?: number
  reason?: string
}

export type ChainRunOutcome = 'done' | 'stopped' | 'failed'

export type ChainNodeState = {
  isRunning?: boolean
  isFinished?: boolean
  isFailed?: boolean
  waitStartedAt?: number
  waitEndsAt?: number
}

export type ChainRunGraph = Pick<ChainAction, 'nodes' | 'edges'>

export type RunContext = {
  connectionId: string
  variables: Map<string, VariableValue>
  lastMessage?: BusMessage
  iteration: number
  isStopped: () => boolean
  wait: (ms: number) => Promise<void>
  setNodeState: (nodeId: string, state: ChainNodeState) => void
  setLogText: (nodeId: string, text: string) => void
}

export type NodeExecutor = (node: ChainActionNode, context: RunContext) => Promise<string | void>

export type ChainRunHooks = {
  onNodeState?: (nodeId: string, state: ChainNodeState) => void
  onLog?: (log: ChainRunLogEntry[]) => void
}

export type ChainRunOptions = {
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

const stepLabel = (node: ChainActionNode) =>
  node.type === 'wait'
    ? `Wait ${node.data?.duration || 0} ${node.data?.durationType || 'ms'}`
    : chainStepLabel(node)

const executeWait: NodeExecutor = async (node, context) => {
  if (node.type !== 'wait') return

  const duration = node.data?.duration || 500
  const durationType = node.data?.durationType || 'ms'
  const ms = duration * (durationType === 's' ? 1000 : 1)
  const startedAt = Date.now()

  context.setNodeState(node.id, { waitStartedAt: startedAt, waitEndsAt: startedAt + ms })
  context.setLogText(node.id, `Waiting ${duration} ${durationType}`)

  await context.wait(ms)
}

const executeAction: NodeExecutor = async (node, context) => {
  if (node.type !== 'action') return

  const action = node.data?.action

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

  ElectronApi.sendMqttMessage(context.connectionId, topic, payload, options)
}

const doneText = (node: ChainActionNode) =>
  node.type === 'action' ? `${stepLabel(node)} sent` : stepLabel(node)

export const chainActions = (graph: ChainRunGraph): Action[] =>
  chainSteps(graph).flatMap((node) =>
    node.type === 'action' && node.data?.action ? [node.data.action] : []
  )

export const chainVariableSource = (graph: ChainRunGraph) => {
  const actions = chainActions(graph)
  const sources = actions.flatMap((action) => [
    action,
    { payload: action.topic, payloadFormat: 'raw' as const }
  ])

  return {
    source: mergedVariableSource(sources),
    hasUuid: actions.some((action) => hasGeneratedUuid(action.payload))
  }
}

export const nodeExecutors: Partial<Record<string, NodeExecutor>> = {
  action: executeAction,
  wait: executeWait
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

  let stopped = false
  let failed = false

  for (const edge of graph.edges) {
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, [])

    outgoing.get(edge.source)!.push(edge)
  }

  let log: ChainRunLogEntry[] = [
    { id: 'start', text: 'Started', state: 'done', time: Date.now() },
    ...chainSteps(graph)
      .filter((node) => node.type !== 'start')
      .map((node) => ({ id: node.id, text: stepLabel(node), state: 'pending' as const }))
  ]

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

  const context: RunContext = {
    connectionId,
    variables: new Map(Object.entries(options.variables ?? {})),
    iteration: 1,
    isStopped: () => stopped,
    wait,
    setNodeState,
    setLogText: (nodeId, text) => patchLog(nodeId, { text })
  }

  const followEdges = async (nodeId: string, handle: string | void) => {
    const edges = (outgoing.get(nodeId) ?? []).filter(
      (edge) => !handle || edge.sourceHandle === handle
    )

    await Promise.allSettled(
      edges.map(async (edge) => {
        const next = nodes.get(edge.target)

        if (next) await executeNode(next)
      })
    )
  }

  const executeNode = async (node: ChainActionNode): Promise<void> => {
    if (stopped) return

    setNodeState(node.id, { ...resetNodeState, isRunning: true })
    patchLog(node.id, { state: 'active', time: Date.now() })

    let handle: string | void

    try {
      handle = await nodeExecutors[node.type ?? '']?.(node, context)
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
    patchLog(node.id, { state: 'done', time: Date.now(), text: doneText(node) })

    await followEdges(node.id, handle)
  }

  for (const node of graph.nodes) setNodeState(node.id, resetNodeState)

  publishLog()

  const done = followEdges('start', undefined).then((): ChainRunOutcome => {
    if (stopped) {
      log = log.map((entry) =>
        entry.state === 'active' || entry.state === 'pending'
          ? { ...entry, state: 'stopped' }
          : entry
      )
      publishLog()

      return 'stopped'
    }

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
