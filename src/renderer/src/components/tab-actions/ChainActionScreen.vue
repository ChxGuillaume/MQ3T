<script setup lang="ts">
import { Connection, ConnectionMode, Edge, NodeProps, useVueFlow, VueFlow } from '@vue-flow/core'
import ActionNode from '@renderer/components/tab-actions/action-chain/ActionNode.vue'
import StartNode from '@renderer/components/tab-actions/action-chain/StartNode.vue'
import WaitNode from '@renderer/components/tab-actions/action-chain/WaitNode.vue'
import { useRunActionChain } from '@renderer/composables/useRunActionChain'
import { ChainAction, ChainActionNode } from '../../../../types/actions'
import { useChainActionsStore } from '@renderer/store/chain-actions'
import { useSettingsStore } from '@renderer/store/settings-store'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useActionsStore } from '@renderer/store/actions'
import { Background } from '@vue-flow/background'
import { computed, onMounted, ref } from 'vue'
import { v4 as uuidV4 } from 'uuid'

const props = defineProps<{
  chainAction?: ChainAction
}>()
const emit = defineEmits(['back'])

const chainActionsStore = useChainActionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()

const nodes = ref<ChainActionNode[]>([])
const edges = ref<Edge[]>([])

const name = ref('Chain Action Name')
const editName = ref(false)

const selectedConnection = computed(() => mqttTopicsStore.selectedConnection)

const trackPadMode = computed({
  get: () => settingsStore.chainActionsTrackpadMode,
  set: (value) => settingsStore.setChainActionsTrackpadMode(value)
})

const { onConnect, addNodes, addEdges, fitView, removeNodes } = useVueFlow()
const { running, run } = useRunActionChain()

onConnect((params) => {
  addEdges({ ...params, animated: true })
})

const addNode = (type: 'action' | 'wait') => {
  nodes.value.push({
    id: uuidV4(),
    type,
    position: { x: 30, y: 130 }
  })
}

const copyNode = (node: NodeProps) => {
  nodes.value.push({
    id: uuidV4(),
    type: node.type,
    position: { x: node.position.x + 40, y: node.position.y + 60 },
    data: node.data
  } as ChainActionNode)
}

function resetTransform() {
  fitView()
}

const isValid = (node: Connection) => {
  return !edges.value.some((edge) => edge.target === node.target)
}

const save = () => {
  if (!props.chainAction) {
    chainActionsStore.addChainAction(selectedConnection.value, actionsStore.selectedActionGroup, {
      groupId: actionsStore.selectedActionGroup,
      name: name.value,
      nodes: nodes.value,
      edges: edges.value
    })
  } else {
    chainActionsStore.updateChainAction(selectedConnection.value, props.chainAction.groupId, {
      ...props.chainAction,
      name: name.value,
      nodes: nodes.value,
      edges: edges.value
    })
  }

  emit('back')
}

onMounted(() => {
  if (props.chainAction) {
    name.value = props.chainAction.name

    addNodes(props.chainAction.nodes)
    addEdges(props.chainAction.edges)
  } else {
    addNodes({ id: 'start', type: 'start', position: { x: 30, y: 40 }, deletable: false })
  }

  fitView()
})
</script>

<template>
  <div class="tw-h-full tw-w-full">
    <vue-flow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :zoom-activation-key-code="trackPadMode ? 'Shift' : null"
      :pan-activation-key-code="!trackPadMode ? 'Shift' : null"
      :connection-mode="ConnectionMode.Strict"
      :is-valid-connection="isValid"
      :pan-on-scroll="trackPadMode"
      :snap-grid="[10, 10]"
      :min-zoom="0.75"
      :max-zoom="2"
      fit-view-on-init
      zoom-on-scroll
      snap-to-grid
    >
      <background :gap="20" />

      <template #node-start="props">
        <start-node :id="props.id" />
      </template>

      <template #node-action="props">
        <action-node
          :id="props.id"
          :data="props.data"
          @copy="copyNode(props)"
          @remove="removeNodes([props.id])"
        />
      </template>

      <template #node-wait="props">
        <wait-node :id="props.id" :data="props.data" />
      </template>
    </vue-flow>

    <q-card flat class="tw-absolute tw-left-0 tw-top-0 tw-bg-transparent">
      <q-card-section v-if="editName" class="tw-flex tw-items-center tw-gap-2">
        <q-input
          v-model="name"
          standout
          class="tw-w-80 tw-text-xl"
          @keydown.enter.prevent="editName = false"
        />
        <q-btn color="secondary" flat round @click="editName = false">
          <q-icon name="fa-solid fa-check" />
        </q-btn>
      </q-card-section>
      <q-card-actions
        v-else
        class="tw-flex tw-select-none tw-items-center tw-gap-2 tw-px-[27px] tw-py-[23px]"
      >
        <h1 class="tw-text-xl">{{ name }}</h1>
        <q-btn color="secondary" flat round @click="editName = true">
          <q-icon name="fa-solid fa-pen" size="xs" />
        </q-btn>
      </q-card-actions>
    </q-card>

    <q-btn-group class="tw-absolute tw-bottom-4 tw-left-4" rounded>
      <q-btn color="primary">
        <q-icon name="fa-solid fa-plus" />
        <q-menu>
          <q-list dense>
            <q-item v-close-popup class="tw-text-accent" clickable @click="addNode('action')">
              <q-item-section>
                <div><q-icon name="fa-solid fa-paper-plane" class="tw-mr-2" /> Action Node</div>
              </q-item-section>
            </q-item>
            <q-item v-close-popup class="tw-text-tertiary" clickable @click="addNode('wait')">
              <q-item-section>
                <div><q-icon name="fa-solid fa-clock" class="tw-mr-2" /> Wait Node</div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>

      <q-btn color="primary" @click="resetTransform">
        <q-icon name="fa-solid fa-expand" />
        <q-tooltip>Reset zoom and pan</q-tooltip>
      </q-btn>

      <div class="tw-rounded-r-full tw-bg-primary tw-pr-4">
        <q-checkbox
          v-model="trackPadMode"
          class="tw-select-none tw-text-white"
          label="Trackpad mode"
          color="accent"
        />
      </div>
    </q-btn-group>

    <q-btn-group class="tw-absolute tw-bottom-4 tw-right-4" rounded>
      <q-btn color="primary" @click="$emit('back')">
        <q-icon name="fa-solid fa-arrow-left" />
        <q-tooltip>Back</q-tooltip>
      </q-btn>

      <q-btn
        color="primary"
        :disable="!selectedConnection || running"
        @click="run(selectedConnection, nodes, edges)"
      >
        <q-circular-progress
          v-if="running"
          color="white"
          indeterminate
          class="tw-mr-2"
          size="16px"
          :thickness="0.5"
        />
        <q-icon v-else name="fa-solid fa-play" />
        <q-tooltip>Play Chain Action</q-tooltip>
      </q-btn>

      <q-btn :disable="running" color="primary" @click="save">
        <q-icon name="fa-solid fa-save" />
        <q-tooltip>Save</q-tooltip>
      </q-btn>
    </q-btn-group>
  </div>
</template>

<style scoped lang="scss"></style>
