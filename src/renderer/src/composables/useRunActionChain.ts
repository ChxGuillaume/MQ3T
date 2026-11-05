import { chainStepLabel, chainSteps } from '@renderer/components/tab-actions/action-utils'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { ChainActionNode } from '../../../types/actions'
import { Edge, Node, useVueFlow } from '@vue-flow/core'
import { IClientPublishOptions } from 'mqtt'
import { computed, ref } from 'vue'

export type ChainRunLogEntry = {
  id: string
  text: string
  state: 'done' | 'active' | 'pending' | 'stopped'
  time?: number
}

const formatTime = (time: number) => {
  const date = new Date(time)
  const pad = (value: number, length = 2) => String(value).padStart(length, '0')

  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

export const formatRunLogTime = (entry: ChainRunLogEntry) => {
  if (entry.state === 'active') return 'now'
  if (entry.state === 'pending') return 'pending'
  if (entry.state === 'stopped') return 'stopped'

  return entry.time ? formatTime(entry.time) : ''
}

export function useRunActionChain() {
  const { updateNodeData } = useVueFlow()

  const running = ref(false)
  const log = ref<ChainRunLogEntry[]>([])

  const _connectionId = ref<string>()
  const _nodes = new Map<string, Node>()
  const _edges = new Map<string, Edge[]>()
  const _clearTimeout = ref<ReturnType<typeof setTimeout>>()
  const _waits = new Set<() => void>()
  let _stopped = false

  const steps = computed(() => log.value.filter((entry) => entry.id !== 'start'))

  const progress = computed(() => {
    const total = steps.value.length
    const done = steps.value.filter((entry) => entry.state === 'done').length

    return { total, done, current: Math.min(total, done + 1) }
  })

  const _wait = (ms: number) =>
    new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(timeout)
        _waits.delete(finish)
        resolve()
      }
      const timeout = setTimeout(finish, ms)

      _waits.add(finish)
    })

  const _setLog = (id: string, patch: Partial<ChainRunLogEntry>) => {
    log.value = log.value.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
  }

  const _actionLabel = (node: Node) =>
    node.type === 'wait'
      ? `Wait ${node.data?.duration || 0} ${node.data?.durationType || 'ms'}`
      : chainStepLabel(node as ChainActionNode)

  const run = (connectionId: string, nodes: Node[], edges: Edge[]) => {
    if (running.value) return

    running.value = true
    _stopped = false

    _connectionId.value = connectionId

    _nodes.clear()
    _edges.clear()

    clearTimeout(_clearTimeout.value)

    for (const node of nodes) {
      _nodes.set(node.id, node)

      updateNodeData(node.id, {
        isRunning: false,
        isFinished: false
      })
    }

    for (const edge of edges) {
      if (!_edges.has(edge.source)) _edges.set(edge.source, [])

      _edges.get(edge.source)?.push(edge)
    }

    log.value = [
      { id: 'start', text: 'Started', state: 'done', time: Date.now() },
      ...chainSteps({ nodes: nodes as ChainActionNode[], edges })
        .filter((node) => node.type !== 'start')
        .map((node) => ({ id: node.id, text: _actionLabel(node), state: 'pending' as const }))
    ]

    const startEdges = _edges.get('start') || []

    Promise.allSettled(
      startEdges.map(async (edge) => {
        const startNode = _nodes.get(edge.target)

        if (startNode) await _executeNode(startNode)
      })
    ).finally(() => {
      running.value = false

      if (_stopped) {
        log.value = log.value.map((entry) =>
          entry.state === 'active' || entry.state === 'pending'
            ? { ...entry, state: 'stopped' }
            : entry
        )
        _clearNodeStatus(nodes)
        return
      }

      _clearTimeout.value = setTimeout(() => _clearNodeStatus(nodes), 4000)
    })
  }

  const stop = () => {
    if (!running.value) return

    _stopped = true

    for (const finish of Array.from(_waits)) finish()
  }

  const _executeNode = async (node: Node) => {
    if (_stopped) return

    updateNodeData(node.id, {
      isRunning: true,
      isFinished: false
    })
    _setLog(node.id, { state: 'active', time: Date.now() })

    switch (node.type) {
      case 'action':
        await _executeActionNode(node)
        break
      case 'wait':
        await _executeWaitNode(node)
        break
    }

    if (_stopped) return

    updateNodeData(node.id, {
      isRunning: false,
      isFinished: true
    })
    _setLog(node.id, {
      state: 'done',
      time: Date.now(),
      text: node.type === 'action' ? `${_actionLabel(node)} sent` : _actionLabel(node)
    })

    const edges = _edges.get(node.id) || []

    await Promise.allSettled(
      edges.map(async (edge) => {
        const nextNode = _nodes.get(edge.target)

        if (nextNode) await _executeNode(nextNode)
      })
    )
  }

  const _executeWaitNode = async (node: Node) => {
    const duration = node.data?.duration || 500
    const durationType = node.data?.durationType || 'ms'
    const calculatedDuration = duration * (durationType === 's' ? 1000 : 1)

    const startedAt = Date.now()

    updateNodeData(node.id, {
      waitStartedAt: startedAt,
      waitEndsAt: startedAt + calculatedDuration
    })
    _setLog(node.id, { text: `Waiting ${duration} ${durationType}` })

    await _wait(calculatedDuration)
  }

  const _executeActionNode = async (node: Node) => {
    if (!_connectionId.value) return
    if (!node.data.action) return

    const action = node.data.action
    const options: IClientPublishOptions = {
      retain: action.retained,
      qos: action.qos
    }

    const isMqtt5 =
      useMqttConnectionsStore().getConnection(_connectionId.value)?.protocolVersion === 5

    if (isMqtt5 && (action.responseTopic || action.correlationData)) {
      options.properties = {}

      if (action.responseTopic) options.properties.responseTopic = action.responseTopic
      if (action.correlationData) {
        options.properties.correlationData = action.correlationData as unknown as Buffer
      }
    }

    ElectronApi.sendMqttMessage(_connectionId.value, action.topic, action.payload, options)
  }

  const _clearNodeStatus = (nodes: Node[]) => {
    for (const node of nodes) {
      updateNodeData(node.id, {
        isRunning: false,
        isFinished: false,
        waitStartedAt: undefined,
        waitEndsAt: undefined
      })
    }
  }

  return { running, run, stop, log, progress }
}
