<script setup lang="ts">
import ActionNode from '@renderer/components/tab-actions/action-chain/ActionNode.vue'
import StartNode from '@renderer/components/tab-actions/action-chain/StartNode.vue'
import WaitNode from '@renderer/components/tab-actions/action-chain/WaitNode.vue'
import { Background } from '@vue-flow/background'
import { v4 as uuidV4 } from 'uuid'
import { ref } from 'vue'
import {
  ConnectionMode,
  useVueFlow,
  Connection,
  NodeProps,
  VueFlow,
  Edge,
  Node
} from '@vue-flow/core'
import { useRunActionChain } from '@renderer/composables/useRunActionChain'
import { useActionsStore } from '@renderer/store/actions'

const trackPadMode = ref(true)

// TODO: DELETE
const aBase = { qos: 0, retained: false }
const ps = () => JSON.parse(JSON.stringify(aBase))
const s = (value: string) => JSON.stringify(value)

const nodes = ref<Node[]>([
  { id: 'start', type: 'start', position: { x: 30, y: 40 }, deletable: false },

  {
    id: '2',
    type: 'action',
    position: { x: 250, y: 30 },
    data: {
      action: {
        ...ps(),
        topic: 'mq3t/chain-action-one',
        payload: s('message 1')
      }
    }
  },
  { id: '5', type: 'wait', position: { x: 470, y: 30 }, data: { duration: 3000 } },
  {
    id: '6',
    type: 'action',
    position: { x: 690, y: 30 },
    data: {
      action: {
        ...ps(),
        topic: 'mq3t/chain-action-three',
        payload: s('message 3')
      }
    }
  },

  { id: '3', type: 'wait', position: { x: 250, y: 180 }, data: { duration: 2000 } },
  {
    id: '4',
    type: 'action',
    position: { x: 470, y: 130 },
    data: {
      action: {
        ...ps(),
        topic: 'mq3t/chain-action-two',
        payload: s('message 2.1')
      }
    }
  },
  {
    id: '7',
    type: 'action',
    position: { x: 470, y: 230 },
    data: {
      action: {
        ...ps(),
        topic: 'mq3t/chain-action-two',
        payload: s('message 2.2')
      }
    }
  }
])

const edges = ref<Edge[]>([
  { id: 'e1-2', source: 'start', target: '2', animated: true },
  { id: 'e1-3', source: 'start', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
  { id: 'e5-6', source: '5', target: '6', animated: true },
  { id: 'e2-5', source: '2', target: '5', animated: true },
  { id: 'e3-7', source: '3', target: '7', animated: true }
])

const { selectedConnection } = useActionsStore()

const { onConnect, addEdges, fitView, removeNodes } = useVueFlow()
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
  })
}

function resetTransform() {
  fitView()
}

const isValid = (node: Connection) => {
  return !edges.value.some((edge) => edge.target === node.target)
}
</script>

<template>
  <div class="tw-w-full tw-h-full">
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

    <q-btn-group class="tw-absolute tw-bottom-4 tw-left-4" rounded>
      <q-btn color="primary">
        <q-icon name="fa-solid fa-plus" />
        <q-menu>
          <q-list dense>
            <q-item class="tw-text-accent" clickable v-close-popup @click="addNode('action')">
              <q-item-section>
                <div><q-icon name="fa-solid fa-paper-plane" class="tw-mr-2" /> Action Node</div>
              </q-item-section>
            </q-item>
            <q-item class="tw-text-tertiary" clickable v-close-popup @click="addNode('wait')">
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

      <div class="tw-bg-primary tw-pr-4 tw-rounded-r-full">
        <q-checkbox v-model="trackPadMode" label="Trackpad mode" color="accent" />
      </div>
    </q-btn-group>

    <q-btn-group class="tw-absolute tw-bottom-4 tw-right-4" rounded>
      <q-btn color="primary" @click="run(selectedConnection, nodes, edges)" :disable="running">
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

      <q-btn color="primary">
        <q-icon name="fa-solid fa-save" />
        <q-tooltip>Save</q-tooltip>
      </q-btn>
    </q-btn-group>
  </div>
</template>

<style scoped lang="scss"></style>
