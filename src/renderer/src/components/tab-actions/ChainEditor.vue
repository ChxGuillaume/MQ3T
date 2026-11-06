<script setup lang="ts">
import { Connection, ConnectionMode, Edge, GraphNode, useVueFlow, VueFlow } from '@vue-flow/core'
import { useRunActionChain } from '@renderer/composables/useRunActionChain'
import { useChainVariablesPrompt } from '@renderer/composables/useChainVariablesPrompt'
import {
  Action,
  ChainAction,
  ChainActionNode,
  WaitMessageNodeData
} from '../../../../types/actions'
import { clone, DEFAULT_GROUP, formatTile, isWildcardTopic, variableFields } from './action-utils'
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import ChainStepTopicDialog from './dialogs/ChainStepTopicDialog.vue'
import { useChainActionsStore } from '@renderer/store/chain-actions'
import { defineShortcuts, useOverlay, useToast } from '@nuxt/ui/composables'
import { useSettingsStore } from '@renderer/store/settings-store'
import { computed, nextTick, onActivated, onDeactivated, onMounted, ref, watch } from 'vue'
import ActionNode from './action-chain/ActionNode.vue'
import StartNode from './action-chain/StartNode.vue'
import WaitNode from './action-chain/WaitNode.vue'
import WaitMessageNode from './action-chain/WaitMessageNode.vue'
import WaitMessageSettings from './action-chain/WaitMessageSettings.vue'
import ConditionNode from './action-chain/ConditionNode.vue'
import ConditionSettings from './action-chain/ConditionSettings.vue'
import ChainRepeatSettings from './action-chain/ChainRepeatSettings.vue'
import ChainRunHistory from './action-chain/ChainRunHistory.vue'
import ChainRunLog from './action-chain/ChainRunLog.vue'
import { useChainRunHistoryStore } from '@renderer/store/chain-run-history'
import { chainVariableSource } from '@renderer/composables/chain-runner'
import { useActionsStore } from '@renderer/store/actions'
import ConfirmDialog from './dialogs/ConfirmDialog.vue'
import ActionDialog from './dialogs/ActionDialog.vue'
import PayloadPreview from './PayloadPreview.vue'
import { resolveNodeAction } from './chain-node-action'
import { layoutChain } from './chain-layout'
import {
  dryRunUpstream,
  findSampleMessage,
  isTopicSubscribed,
  previewCondition,
  stepIssues,
  VariableOrigin
} from './chain-step-help'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { chainSteps } from './action-utils'
import { Background } from '@vue-flow/background'
import { v4 as uuidV4 } from 'uuid'

const DRAG_MIME = 'application/x-mq3t-chain-step'

const props = defineProps<{
  connectionId: string
  groupId: string
  chainAction?: ChainAction
}>()

const emit = defineEmits<{ back: [] }>()

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const chainActionsStore = useChainActionsStore()
const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()
const overlay = useOverlay()
const toast = useToast()
const historyStore = useChainRunHistoryStore()

const confirmModal = overlay.create(ConfirmDialog)
const topicModal = overlay.create(ChainStepTopicDialog)

const {
  nodes,
  edges,
  onConnect,
  addNodes,
  addEdges,
  removeNodes,
  updateNodeData,
  fitView,
  zoomIn,
  zoomOut,
  getSelectedNodes,
  screenToFlowCoordinate,
  findNode
} = useVueFlow()

const { running, run, stop, log, progress, iteration } = useRunActionChain({
  onNodeState: (nodeId, state) => updateNodeData(nodeId, state)
})

const { promptVariables } = useChainVariablesPrompt()

const chainId = ref(props.chainAction?.id)
const name = ref(props.chainAction?.name ?? 'New chain')
const logTab = ref<'run' | 'history'>('history')

const historyCount = computed(() =>
  chainId.value ? historyStore.getChainRuns(chainId.value).length : 0
)

const repeat = ref(props.chainAction?.repeat ? clone(props.chainAction.repeat) : undefined)
const editingName = ref(!props.chainAction)
const savedSnapshot = ref('')

const group = computed(() =>
  props.groupId === 'default'
    ? DEFAULT_GROUP
    : (actionsStore.getConnectionGroup(props.connectionId, props.groupId) ?? DEFAULT_GROUP)
)

const paletteActions = computed(() =>
  actionsStore.getConnectionGroupActions(props.connectionId, props.groupId)
)

const isConnected = computed(
  () => mqttConnectionsStore.getConnectionStatus(props.connectionId) === 'connected'
)

const trackPadMode = computed({
  get: () => settingsStore.chainActionsTrackpadMode,
  set: (value) => settingsStore.setChainActionsTrackpadMode(value)
})

const serialize = () => ({
  name: name.value,
  repeat: repeat.value,
  nodes: nodes.value.map((node) => {
    const {
      isRunning: _r,
      isFinished: _f,
      isFailed: _x,
      waitStartedAt: _s,
      waitEndsAt: _e,
      ...data
    } = node.data ?? {}

    return {
      id: node.id,
      type: node.type,
      position: { x: node.position.x, y: node.position.y },
      data,
      ...(node.deletable === false ? { deletable: false } : {})
    } as ChainActionNode
  }),
  edges: edges.value.map((edge): Edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    animated: true
  }))
})

const isDirty = computed(() => JSON.stringify(serialize()) !== savedSnapshot.value)

onConnect((params) => {
  addEdges({ ...params, animated: true })
})

const isValid = (connection: Connection) =>
  !edges.value.some((edge) => edge.target === connection.target)

const nextPosition = () => {
  const selected = getSelectedNodes.value[0]
  const anchor =
    selected ??
    nodes.value.reduce<GraphNode | undefined>((right, node) => {
      return !right || node.position.x > right.position.x ? node : right
    }, undefined)

  if (!anchor) return { x: 30, y: 130 }

  return { x: anchor.position.x + 260, y: anchor.position.y }
}

const addStep = (
  type: ChainActionNode['type'],
  data: Record<string, unknown>,
  position = nextPosition()
) => {
  const id = uuidV4()

  addNodes({ id, type, position, data } as ChainActionNode)

  return id
}

const addActionStep = async (action: Action, position?: { x: number; y: number }) => {
  const copy = clone(action)
  let topicOverride: string | undefined

  if (isWildcardTopic(copy.topic)) {
    topicOverride = await topicModal.open({ action: copy, connectionId: props.connectionId }).result

    if (!topicOverride) return

    copy.topic = topicOverride
  }

  addStep('action', { action: copy, actionId: action.id, topicOverride }, position)
}

const addWaitMessageStep = (position?: { x: number; y: number }) =>
  addStep(
    'wait-message',
    { topic: '', timeout: 5, timeoutUnit: 's', match: { kind: 'any' }, captures: [] },
    position
  )

const addConditionStep = (position?: { x: number; y: number }) =>
  addStep('condition', { source: 'variable', operator: 'equals', name: '', value: '' }, position)

const addWaitStep = (position?: { x: number; y: number }) =>
  addStep('wait', { duration: 500, durationType: 'ms' }, position)

const handlePaletteDragStart = (event: DragEvent, payload: { type: string; actionId?: string }) => {
  event.dataTransfer?.setData(DRAG_MIME, JSON.stringify(payload))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy'
}

const handleCanvasDragOver = (event: DragEvent) => {
  if (!event.dataTransfer?.types.includes(DRAG_MIME)) return

  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

const handleCanvasDrop = (event: DragEvent) => {
  const raw = event.dataTransfer?.getData(DRAG_MIME)

  if (!raw) return

  event.preventDefault()

  const payload = JSON.parse(raw) as { type: string; actionId?: string }
  const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })

  if (payload.type === 'wait') addWaitStep(position)
  if (payload.type === 'wait-message') addWaitMessageStep(position)
  if (payload.type === 'condition') addConditionStep(position)
  if (payload.type === 'custom') addStep('action', {}, position)
  if (payload.type === 'action') {
    const action = paletteActions.value.find((a) => a.id === payload.actionId)

    if (action) addActionStep(action, position)
  }
}

const duplicateNode = (id: string) => {
  const node = findNode(id)

  if (!node || node.type === 'start') return

  addNodes({
    id: uuidV4(),
    type: node.type,
    position: { x: node.position.x + 40, y: node.position.y + 70 },
    data: clone({ ...node.data, isRunning: false, isFinished: false, isFailed: false })
  } as ChainActionNode)
}

const resolvedActions = computed(
  () =>
    new Map(
      nodes.value.map((node) => [
        node.id,
        resolveNodeAction(node as ChainActionNode, props.connectionId)
      ])
    )
)

const nodeAction = (id: string) =>
  resolvedActions.value.get(id) ?? { action: undefined, linked: false, missing: false }

const actionDialog = ref({
  opened: false,
  nodeId: '',
  linked: false,
  action: undefined as Action | undefined
})

const editActionNode = (id: string) => {
  const { action, linked, missing } = nodeAction(id)
  const node = findNode(id)
  const editsSavedAction = linked && !missing

  actionDialog.value = {
    opened: true,
    nodeId: id,
    linked: editsSavedAction,
    action: editsSavedAction
      ? actionsStore
          .getConnectionActions(props.connectionId)
          .find((saved) => saved.id === node?.data?.actionId)
      : action
  }
}

const handleActionDialogSave = (action: Action) => {
  if (actionDialog.value.linked) {
    actionsStore.updateAction(props.connectionId, action.groupId, action)
    refreshLinkedSnapshots()
    return
  }

  updateNodeData(actionDialog.value.nodeId, { action })
}

const unlinkActionNode = (id: string) => {
  const { action } = nodeAction(id)

  updateNodeData(id, { action: clone(action), actionId: undefined, topicOverride: undefined })
}

const refreshLinkedSnapshots = () => {
  for (const node of nodes.value) {
    const { action, linked, missing } = nodeAction(node.id)

    if (linked && !missing && JSON.stringify(action) !== JSON.stringify(node.data?.action)) {
      updateNodeData(node.id, { action: clone(action) })
    }
  }
}

const selectedNode = computed(() => getSelectedNodes.value[0])

const tidyLayout = async () => {
  const start = findNode('start')
  const positions = layoutChain(
    nodes.value.map((node) => ({
      id: node.id,
      width: node.dimensions.width,
      height: node.dimensions.height
    })),
    edges.value,
    { origin: start ? { ...start.position } : undefined }
  )

  for (const node of nodes.value) {
    const position = positions.get(node.id)

    if (position) node.position = position
  }

  await nextTick()
  fitView({ duration: 300 })
}

const graphNodes = computed(
  () => new Map(nodes.value.map((node) => [node.id, node as ChainActionNode]))
)

const knownTopics = computed(() => mqttTopicsStore.getConnectionTopics(props.connectionId))

const subscriptions = computed(() =>
  (mqttConnectionsStore.getConnection(props.connectionId)?.subscribedTopics ?? []).map(
    (subscription) => subscription.topic
  )
)

const sampleFor = (data: Partial<WaitMessageNodeData>) =>
  findSampleMessage(data, knownTopics.value, (topic) =>
    mqttTopicsStore.getTopicLastMessage(props.connectionId, topic)
  )

const variableOrigins = computed<VariableOrigin[]>(() => {
  const graph = { nodes: nodes.value as ChainActionNode[], edges: edges.value }
  const { source } = chainVariableSource(graph, props.connectionId)
  const origins = new Map<string, VariableOrigin>()

  for (const node of nodes.value) {
    if (node.type !== 'wait-message') continue

    for (const capture of node.data?.captures ?? []) {
      if (capture.name && !origins.has(capture.name)) {
        origins.set(capture.name, { name: capture.name, origin: 'captured', stepId: node.id })
      }
    }
  }

  for (const field of variableFields(source)) {
    if (!origins.has(field.name)) origins.set(field.name, { name: field.name, origin: 'asked' })
  }

  return Array.from(origins.values())
})

const stepTopic = (stepId?: string) => {
  const node = graphNodes.value.get(stepId ?? '')

  return node?.type === 'wait-message' ? node.data?.topic : undefined
}

const conditionVariables = computed(() =>
  variableOrigins.value.map((origin) => ({
    name: origin.name,
    description:
      origin.origin === 'asked'
        ? 'asked when the chain runs'
        : `saved by Wait for ${stepTopic(origin.stepId) || 'message'}`
  }))
)

const nodeIssues = computed(
  () =>
    new Map(
      nodes.value.map((node) => [
        node.id,
        stepIssues(node as ChainActionNode, {
          edges: edges.value,
          nodes: graphNodes.value,
          origins: variableOrigins.value,
          subscriptions: subscriptions.value,
          actionMissing: nodeAction(node.id).missing
        })
      ])
    )
)

const issuesOf = (id: string) => nodeIssues.value.get(id) ?? []

const selectedDryRun = computed(() =>
  selectedNode.value?.type === 'condition'
    ? dryRunUpstream(selectedNode.value.id, graphNodes.value, edges.value, sampleFor)
    : undefined
)

const conditionPreview = computed(() =>
  selectedNode.value?.type === 'condition' && selectedDryRun.value
    ? previewCondition(selectedNode.value.data ?? {}, selectedDryRun.value, variableOrigins.value)
    : { kind: 'unknown' as const }
)

const selectedSample = computed(() => {
  if (selectedNode.value?.type === 'wait-message') return sampleFor(selectedNode.value.data ?? {})
  if (selectedNode.value?.type === 'condition') return selectedDryRun.value?.lastMessage

  return undefined
})

const selectedSubscribed = computed(() => {
  const topic = selectedNode.value?.data?.topic

  return !topic || isTopicSubscribed(topic, subscriptions.value)
})

const describeStep = (node: ChainActionNode) => {
  switch (node.type) {
    case 'action':
      return nodeAction(node.id).action?.name || 'Message step'
    case 'wait-message':
      return 'Wait for message'
    case 'condition':
      return 'Condition'
    default:
      return 'Step'
  }
}

const selectedAction = computed(() =>
  selectedNode.value ? nodeAction(selectedNode.value.id) : undefined
)

const waitDuration = computed({
  get: () => Number(selectedNode.value?.data?.duration ?? 0),
  set: (value) => {
    if (selectedNode.value) updateNodeData(selectedNode.value.id, { duration: Math.max(0, value) })
  }
})

const waitDurationType = computed<'ms' | 's'>({
  get: () => selectedNode.value?.data?.durationType ?? 'ms',
  set: (value) => {
    if (selectedNode.value) updateNodeData(selectedNode.value.id, { durationType: value })
  }
})

const nodeStatusKey = computed(() =>
  nodes.value
    .map((node) => `${node.id}:${node.data?.isRunning ? 1 : 0}${node.data?.isFinished ? 1 : 0}`)
    .join('|')
)

const edgeKey = computed(() =>
  edges.value.map((edge) => `${edge.id}:${edge.sourceHandle ?? ''}`).join('|')
)

const BRANCH_LABEL_COLORS: Record<string, string> = {
  true: 'var(--ui-success)',
  false: 'var(--ui-error)'
}

watch([nodeStatusKey, running, edgeKey], () => {
  const nodeData = new Map(nodes.value.map((node) => [node.id, node.data ?? {}]))

  for (const edge of edges.value) {
    const source =
      edge.source === 'start'
        ? { isFinished: running.value || log.value.length > 0 }
        : nodeData.get(edge.source)
    const target = nodeData.get(edge.target)
    const reached = target?.isRunning || target?.isFinished

    const status = source?.isFinished && reached ? 'is-done' : running.value ? 'is-pending' : ''
    const branchColor = BRANCH_LABEL_COLORS[edge.sourceHandle ?? '']

    edge.class = [status, branchColor ? `branch-${edge.sourceHandle}` : '']
      .filter(Boolean)
      .join(' ')

    if (branchColor) {
      edge.label = edge.sourceHandle ?? ''
      edge.labelStyle = { fill: branchColor, fontWeight: 700, fontSize: '11px' }
      edge.labelBgStyle = { fill: 'var(--ui-bg)' }
      edge.labelBgPadding = [6, 3]
      edge.labelBgBorderRadius = 4
    }
  }
})

const statusLabel = computed(() => {
  if (running.value) {
    const { current, total } = iteration.value
    const runLabel =
      total === 1 ? '' : total === 0 ? `Run ${current} · ` : `Run ${current}/${total} · `

    return `Running · ${runLabel}step ${progress.value.current} of ${progress.value.total}`
  }
  if (log.value.some((entry) => entry.state === 'stopped')) return 'Stopped'
  if (log.value.some((entry) => entry.state === 'failed')) return 'Failed'
  if (log.value.length) return 'Finished'
  return ''
})

const confirmIncompleteSteps = async (graph: ReturnType<typeof serialize>) => {
  const problems = chainSteps(graph).flatMap((node) =>
    issuesOf(node.id).map((issue) => `${describeStep(node)}: ${issue}`)
  )

  if (!problems.length) return true

  return !!(await confirmModal.open({
    title: `${problems.length} thing${problems.length === 1 ? '' : 's'} to fix before running`,
    description: problems.join(' · '),
    confirmLabel: 'Run anyway',
    confirmIcon: 'i-lucide-play'
  }).result)
}

const handleRun = async () => {
  const graph = serialize()

  if (!(await confirmIncompleteSteps(graph))) return
  const variables = await promptVariables(name.value, graph, props.connectionId)

  if (!variables) return

  logTab.value = 'run'
  run(props.connectionId, graph, { variables, chainId: chainId.value })
}

const save = () => {
  refreshLinkedSnapshots()

  const data = serialize()

  if (!data.name.trim()) {
    editingName.value = true
    toast.add({
      title: 'Give the chain a name first',
      color: 'warning',
      icon: 'i-lucide-circle-alert'
    })
    return
  }

  const existing = chainId.value ? chainActionsStore.getChainAction(chainId.value) : null

  if (existing) {
    chainActionsStore.updateChainAction(props.connectionId, existing.groupId, {
      ...existing,
      ...clone(data),
      repeat: data.repeat ? clone(data.repeat) : undefined
    })
  } else {
    chainActionsStore.addChainAction(props.connectionId, props.groupId, {
      groupId: props.groupId,
      ...clone(data)
    })

    const list = chainActionsStore.getGroupChainActions(props.connectionId, props.groupId)
    chainId.value = list[list.length - 1]?.id
  }

  savedSnapshot.value = JSON.stringify(data)
  toast.add({ title: 'Chain saved', icon: 'i-lucide-check', color: 'success', duration: 1500 })
}

const handleBack = async () => {
  if (isDirty.value) {
    const confirmed = await confirmModal.open({
      title: 'Discard unsaved changes?',
      description: `Your changes to “${name.value}” will be lost.`,
      confirmLabel: 'Discard',
      danger: true
    }).result

    if (!confirmed) return
  }

  stop()
  emit('back')
}

const active = ref(true)
onActivated(() => (active.value = true))
onDeactivated(() => (active.value = false))

defineShortcuts({
  meta_enter: {
    usingInput: true,
    handler: () => {
      if (active.value && !running.value && isConnected.value) handleRun()
    }
  },
  escape: () => {
    if (active.value && running.value) stop()
  },
  meta_s: {
    usingInput: true,
    handler: () => {
      if (active.value && !running.value) save()
    }
  }
})

onMounted(async () => {
  if (props.chainAction) {
    addNodes(clone(props.chainAction.nodes))
    addEdges(clone(props.chainAction.edges))
  } else {
    addNodes({ id: 'start', type: 'start', position: { x: 30, y: 40 }, deletable: false })
  }

  await nextTick()
  refreshLinkedSnapshots()
  savedSnapshot.value = props.chainAction ? JSON.stringify(serialize()) : ''
  fitView()
})
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <header class="border-default flex flex-wrap items-center gap-3 border-b px-5 py-3">
      <button
        type="button"
        class="text-muted hover:text-default flex items-center gap-1 text-[13px]"
        @click="handleBack"
      >
        <UIcon name="i-lucide-chevron-left" class="size-4" />
        {{ group.name }}
      </button>
      <UInput
        v-if="editingName"
        v-model="name"
        autofocus
        placeholder="Chain name"
        class="w-72"
        :ui="{ base: 'text-base font-bold' }"
        @keydown.enter.prevent="editingName = false"
        @blur="editingName = !name.trim()"
      />
      <button
        v-else
        type="button"
        class="group flex items-center gap-2 text-xl font-bold"
        title="Rename"
        @click="editingName = true"
      >
        {{ name }}
        <UIcon
          name="i-lucide-pencil"
          class="text-muted size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
        />
      </button>
      <span
        v-if="statusLabel"
        class="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold"
        :class="running ? 'bg-primary/10 text-primary' : 'bg-muted text-muted'"
      >
        <span class="size-1.5 rounded-full" :class="running ? 'bg-primary' : 'bg-muted'" />
        {{ statusLabel }}
      </span>
      <span v-if="isDirty" class="text-warning flex items-center gap-1.5 text-xs">
        <span class="bg-warning size-1.5 rounded-full" />
        Unsaved changes
      </span>

      <div class="ml-auto flex gap-2">
        <UTooltip v-if="running" text="Stop" :kbds="['escape']">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-square"
            label="Stop"
            @click="stop"
          />
        </UTooltip>
        <UTooltip
          v-else
          :text="isConnected ? 'Run chain' : 'Connection is not active'"
          :kbds="isConnected ? ['meta', 'enter'] : undefined"
        >
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-play"
            label="Run"
            :disabled="!isConnected"
            @click="handleRun"
          />
        </UTooltip>
        <UButton label="Save" class="font-semibold" :disabled="running" @click="save" />
      </div>
    </header>

    <div class="flex min-h-0 flex-1">
      <nav
        aria-label="Add steps"
        class="border-default flex w-[250px] shrink-0 flex-col gap-1.5 overflow-auto border-r px-3 py-4"
      >
        <div class="text-muted px-1.5 pb-1 text-[11px] font-semibold tracking-[0.1em] uppercase">
          Drag onto the canvas
        </div>
        <button
          type="button"
          draggable="true"
          class="border-default hover:bg-muted flex items-center gap-2.5 rounded-md border border-dashed p-2 text-[13px] font-semibold"
          @dragstart="handlePaletteDragStart($event, { type: 'wait' })"
          @click="addWaitStep()"
        >
          <span
            class="border-default text-muted flex size-7 shrink-0 items-center justify-center rounded-sm border"
          >
            <UIcon name="i-lucide-timer" class="size-3.5" />
          </span>
          Wait
        </button>
        <button
          type="button"
          draggable="true"
          class="border-default hover:bg-muted flex items-center gap-2.5 rounded-md border border-dashed p-2 text-[13px] font-semibold"
          @dragstart="handlePaletteDragStart($event, { type: 'custom' })"
          @click="addStep('action', {})"
        >
          <span
            class="border-default text-muted flex size-7 shrink-0 items-center justify-center rounded-sm border"
          >
            <UIcon name="i-lucide-send" class="size-3.5" />
          </span>
          Custom message
        </button>
        <button
          type="button"
          draggable="true"
          class="border-default hover:bg-muted flex items-center gap-2.5 rounded-md border border-dashed p-2 text-[13px] font-semibold"
          @dragstart="handlePaletteDragStart($event, { type: 'wait-message' })"
          @click="addWaitMessageStep()"
        >
          <span
            class="border-default text-muted flex size-7 shrink-0 items-center justify-center rounded-sm border"
          >
            <UIcon name="i-lucide-radio" class="size-3.5" />
          </span>
          Wait for message
        </button>
        <button
          type="button"
          draggable="true"
          class="border-default hover:bg-muted flex items-center gap-2.5 rounded-md border border-dashed p-2 text-[13px] font-semibold"
          @dragstart="handlePaletteDragStart($event, { type: 'condition' })"
          @click="addConditionStep()"
        >
          <span
            class="border-default text-muted flex size-7 shrink-0 items-center justify-center rounded-sm border"
          >
            <UIcon name="i-lucide-git-branch" class="size-3.5" />
          </span>
          Condition
        </button>

        <div
          class="text-muted px-1.5 pt-2.5 pb-1 text-[11px] font-semibold tracking-[0.1em] uppercase"
        >
          Actions in this group
        </div>
        <button
          v-for="action in paletteActions"
          :key="action.id"
          type="button"
          draggable="true"
          class="border-default hover:bg-muted flex items-center gap-2.5 rounded-md border p-2 text-left text-[13px] font-semibold"
          :title="action.topic"
          @dragstart="handlePaletteDragStart($event, { type: 'action', actionId: action.id })"
          @click="addActionStep(action)"
        >
          <span
            class="border-default flex size-7 shrink-0 items-center justify-center rounded-sm border font-mono text-[11px] font-bold"
            :class="formatTile(action.payloadFormat).class"
          >
            {{ formatTile(action.payloadFormat).glyph }}
          </span>
          <span class="min-w-0 flex-1 truncate">{{ action.name }}</span>
          <span
            v-if="isWildcardTopic(action.topic)"
            title="Wildcard topic"
            class="bg-primary/10 text-primary rounded-xs px-1.5 text-xs font-bold"
          >
            +
          </span>
        </button>
        <p v-if="!paletteActions.length" class="text-muted px-1.5 text-xs">
          This group has no actions yet.
        </p>
        <p v-else class="text-muted mx-1.5 mt-2 text-xs leading-[1.45]">
          Actions marked <b class="text-primary">+</b> use a wildcard topic. When you drop one here,
          pick which topic this step sends to.
        </p>
      </nav>

      <main
        aria-label="Chain canvas"
        class="chain-canvas bg-muted relative min-w-0 flex-1"
        @dragover="handleCanvasDragOver"
        @drop="handleCanvasDrop"
      >
        <VueFlow
          :zoom-activation-key-code="trackPadMode ? 'Shift' : null"
          :pan-activation-key-code="!trackPadMode ? 'Shift' : null"
          :connection-mode="ConnectionMode.Strict"
          :is-valid-connection="isValid"
          :pan-on-scroll="trackPadMode"
          :snap-grid="[10, 10]"
          :min-zoom="0.5"
          :max-zoom="2"
          fit-view-on-init
          zoom-on-scroll
          snap-to-grid
        >
          <Background :gap="20" :size="1.2" pattern-color="var(--ui-border-accented)" />

          <template #node-start="nodeProps">
            <StartNode :id="nodeProps.id" :selected="nodeProps.selected" />
          </template>

          <template #node-action="nodeProps">
            <ActionNode
              :id="nodeProps.id"
              :data="nodeProps.data"
              :issues="issuesOf(nodeProps.id)"
              :action="nodeAction(nodeProps.id).action"
              :linked="nodeAction(nodeProps.id).linked"
              :missing="nodeAction(nodeProps.id).missing"
              :selected="nodeProps.selected"
              :dimmed="running"
              @edit="editActionNode(nodeProps.id)"
              @copy="duplicateNode(nodeProps.id)"
              @remove="removeNodes([nodeProps.id])"
            />
          </template>

          <template #node-wait="nodeProps">
            <WaitNode
              :id="nodeProps.id"
              :data="nodeProps.data"
              :selected="nodeProps.selected"
              @copy="duplicateNode(nodeProps.id)"
              @remove="removeNodes([nodeProps.id])"
            />
          </template>

          <template #node-condition="nodeProps">
            <ConditionNode
              :id="nodeProps.id"
              :data="nodeProps.data"
              :issues="issuesOf(nodeProps.id)"
              :selected="nodeProps.selected"
              :dimmed="running"
              @copy="duplicateNode(nodeProps.id)"
              @remove="removeNodes([nodeProps.id])"
            />
          </template>

          <template #node-wait-message="nodeProps">
            <WaitMessageNode
              :id="nodeProps.id"
              :data="nodeProps.data"
              :issues="issuesOf(nodeProps.id)"
              :selected="nodeProps.selected"
              :dimmed="running"
              @copy="duplicateNode(nodeProps.id)"
              @remove="removeNodes([nodeProps.id])"
            />
          </template>
        </VueFlow>

        <div
          class="border-default bg-default absolute right-4 bottom-4 flex items-center gap-1 rounded-lg border p-1"
        >
          <UTooltip text="Trackpad mode: scroll pans, Shift + scroll zooms">
            <UButton
              color="neutral"
              :variant="trackPadMode ? 'soft' : 'ghost'"
              icon="i-lucide-mouse-pointer-2"
              aria-label="Trackpad mode"
              @click="trackPadMode = !trackPadMode"
            />
          </UTooltip>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-minus"
            aria-label="Zoom out"
            @click="zoomOut()"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-plus"
            aria-label="Zoom in"
            @click="zoomIn()"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-scan"
            aria-label="Fit view"
            @click="fitView()"
          />
          <UTooltip text="Tidy up the layout">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-wand-sparkles"
              aria-label="Tidy up the layout"
              :disabled="nodes.length < 2"
              @click="tidyLayout"
            />
          </UTooltip>
        </div>
      </main>

      <aside
        aria-label="Step details"
        class="border-default flex w-[320px] shrink-0 flex-col gap-3.5 overflow-auto border-l p-4"
      >
        <div class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
          Selected step
        </div>

        <template v-if="selectedNode?.type === 'wait'">
          <h2 class="text-base font-bold">Wait</h2>
          <div class="flex items-end gap-2">
            <UFormField label="Duration" class="flex-1">
              <UInput v-model.number="waitDuration" type="number" min="0" class="w-full" />
            </UFormField>
            <SegmentedControl
              v-model="waitDurationType"
              :items="[
                { label: 'ms', value: 'ms' },
                { label: 's', value: 's' }
              ]"
            />
          </div>
          <div class="flex gap-2">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-copy"
              label="Duplicate"
              @click="duplicateNode(selectedNode.id)"
            />
            <UButton
              size="sm"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              label="Delete"
              @click="removeNodes([selectedNode.id])"
            />
          </div>
        </template>

        <template v-else-if="selectedNode?.type === 'condition'">
          <h2 class="text-base font-bold">Condition</h2>
          <ConditionSettings
            :key="selectedNode.id"
            :data="selectedNode.data ?? {}"
            :variables="conditionVariables"
            :preview="conditionPreview"
            :sample="selectedSample"
            :has-message-step="!!selectedDryRun?.hasMessageStep"
            @update="updateNodeData(selectedNode.id, $event)"
          />
          <div class="flex gap-2">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-copy"
              label="Duplicate"
              @click="duplicateNode(selectedNode.id)"
            />
            <UButton
              size="sm"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              label="Delete"
              @click="removeNodes([selectedNode.id])"
            />
          </div>
        </template>

        <template v-else-if="selectedNode?.type === 'wait-message'">
          <h2 class="text-base font-bold">Wait for message</h2>
          <WaitMessageSettings
            :key="selectedNode.id"
            :data="selectedNode.data ?? {}"
            :sample="selectedSample"
            :known-topics="knownTopics"
            :subscribed="selectedSubscribed"
            @update="updateNodeData(selectedNode.id, $event)"
          />
          <div class="flex gap-2">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-copy"
              label="Duplicate"
              @click="duplicateNode(selectedNode.id)"
            />
            <UButton
              size="sm"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              label="Delete"
              @click="removeNodes([selectedNode.id])"
            />
          </div>
        </template>

        <template v-else-if="selectedNode?.type === 'action'">
          <template v-if="selectedAction?.action">
            <h2 class="text-base font-bold">{{ selectedAction.action.name || 'Action' }}</h2>
            <div class="text-primary font-mono text-xs break-all">
              {{ selectedAction.action.topic }}
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-if="selectedAction.missing"
                class="bg-error/10 text-error flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs"
              >
                <UIcon name="i-lucide-unlink" class="size-3" />
                Linked action deleted
              </span>
              <span
                v-else-if="selectedAction.linked"
                class="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs"
              >
                <UIcon name="i-lucide-link" class="size-3" />
                Linked to saved action
              </span>
              <span class="bg-muted text-muted rounded-full px-2.5 py-0.5 text-xs">
                QoS {{ selectedAction.action.qos }}
              </span>
              <span
                v-if="selectedAction.action.retained"
                class="bg-muted text-muted rounded-full px-2.5 py-0.5 text-xs"
              >
                Retain
              </span>
            </div>
            <p v-if="selectedAction.linked && !selectedAction.missing" class="text-muted text-xs">
              Edits change the saved action and every chain that uses it.
            </p>
            <p v-else-if="selectedAction.missing" class="text-muted text-xs">
              The saved action was deleted. Unlink to keep this step as a copy.
            </p>
            <PayloadPreview
              :payload="selectedAction.action.payload"
              :format="selectedAction.action.payloadFormat"
              dense
              class="max-h-48"
            />
          </template>
          <p v-else class="text-muted text-sm">This step has no message yet.</p>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-if="!selectedAction?.missing"
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil"
              :label="selectedAction?.action ? 'Edit' : 'Set up'"
              @click="editActionNode(selectedNode.id)"
            />
            <UButton
              v-if="selectedAction?.linked"
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-unlink"
              label="Unlink"
              title="Keep this step as an independent copy"
              @click="unlinkActionNode(selectedNode.id)"
            />
            <UButton
              v-if="selectedAction?.action"
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-copy"
              label="Duplicate"
              @click="duplicateNode(selectedNode.id)"
            />
            <UButton
              size="sm"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              label="Delete"
              @click="removeNodes([selectedNode.id])"
            />
          </div>
        </template>

        <p v-else-if="selectedNode?.type === 'start'" class="text-muted text-sm">
          Every chain begins here. Drag from its right handle to the first step.
        </p>
        <p v-else class="text-muted text-sm">
          Select a step to edit it. Connect steps by dragging from a step's right handle to the next
          one.
        </p>

        <template v-if="!selectedNode">
          <div class="text-muted mt-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase">
            Chain settings
          </div>
          <ChainRepeatSettings v-model="repeat" />
        </template>

        <template v-if="log.length || historyCount">
          <SegmentedControl
            v-model="logTab"
            size="sm"
            class="mt-2.5 self-start"
            :items="[
              { label: 'This run', value: 'run', disabled: !log.length },
              { label: `History (${historyCount})`, value: 'history', disabled: !historyCount }
            ]"
          />
          <ChainRunLog v-if="logTab === 'run' && log.length" :entries="log" />
          <ChainRunHistory v-else-if="chainId" :chain-id="chainId" />
        </template>
      </aside>
    </div>

    <ActionDialog
      v-model:opened="actionDialog.opened"
      :edit-mode="!!actionDialog.action"
      :action="actionDialog.action"
      :connection-id="connectionId"
      :no-wildcard="!actionDialog.linked"
      variable-completion
      @create:action="handleActionDialogSave"
      @update:action="handleActionDialogSave"
    />
  </div>
</template>

<style>
.chain-canvas .vue-flow__handle {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  border: 2px solid var(--ui-bg);
  background: var(--ui-border-accented);
}

.chain-canvas .vue-flow__node.selected .vue-flow__handle,
.chain-canvas .vue-flow__handle:hover {
  background: var(--ui-primary);
}

.chain-canvas .vue-flow__edge-path {
  stroke: var(--ui-border-accented);
  stroke-width: 2;
}

.chain-canvas .vue-flow__edge.selected .vue-flow__edge-path {
  stroke: var(--ui-primary);
}

.chain-canvas .vue-flow__edge.is-done .vue-flow__edge-path {
  stroke: var(--ui-success);
  stroke-dasharray: none;
  animation: none;
}

.chain-canvas .vue-flow__edge.is-pending .vue-flow__edge-path {
  stroke: var(--ui-border);
}

.chain-canvas .vue-flow__edge.branch-true:not(.is-done):not(.is-pending) .vue-flow__edge-path {
  stroke: color-mix(in oklab, var(--ui-success) 70%, transparent);
}

.chain-canvas .vue-flow__edge.branch-false:not(.is-done):not(.is-pending) .vue-flow__edge-path {
  stroke: color-mix(in oklab, var(--ui-error) 70%, transparent);
}

.chain-canvas .vue-flow__connection-path {
  stroke: var(--ui-primary);
  stroke-width: 2;
}

.chain-canvas .vue-flow__selection,
.chain-canvas .vue-flow__nodesselection-rect {
  background: color-mix(in oklab, var(--ui-primary) 8%, transparent);
  border: 1px dotted var(--ui-primary);
}
</style>
