import { ElectronApi } from '@renderer/assets/js/electron-api'
import { Edge, Node, useVueFlow } from '@vue-flow/core'
import { ref } from 'vue'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function useRunActionChain() {
  const { updateNodeData } = useVueFlow()

  const running = ref(false)

  const _connectionId = ref<string>()
  const _nodes = new Map<string, Node>()
  const _edges = new Map<string, Edge[]>()
  const _clearTimeout = ref<ReturnType<typeof setTimeout>>()

  const run = (connectionId: string, nodes: Node[], edges: Edge[]) => {
    if (running.value) return

    running.value = true

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

    const startEdges = _edges.get('start') || []

    Promise.allSettled(
      startEdges.map(async (edge) => {
        const startNode = _nodes.get(edge.target)

        if (startNode) await _executeNode(startNode)
      })
    ).finally(() => {
      running.value = false
      _clearTimeout.value = setTimeout(() => _clearNodeStatus(nodes), 4000)
    })
  }

  const _executeNode = async (node: Node) => {
    updateNodeData(node.id, {
      isRunning: true,
      isFinished: false
    })

    switch (node.type) {
      case 'action':
        await _executeActionNode(node)
        break
      case 'wait':
        await _executeWaitNode(node)
        break
    }

    updateNodeData(node.id, {
      isRunning: false,
      isFinished: true
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

    await wait(calculatedDuration)
  }

  const _executeActionNode = async (node: Node) => {
    if (!_connectionId.value) return
    if (!node.data.action) return

    const action = node.data.action
    const options = {
      retain: action.retained,
      qos: action.qos
    }

    ElectronApi.sendMqttMessage(_connectionId.value, action.topic, action.payload, options)
  }

  const _clearNodeStatus = (nodes: Node[]) => {
    for (const node of nodes) {
      updateNodeData(node.id, {
        isRunning: false,
        isFinished: false
      })
    }
  }

  return { running, run }
}
