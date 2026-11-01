<script setup lang="ts">
import ActionCardContextMenu from '@renderer/components/tab-actions/ActionCardContextMenu.vue'
import { useRunActionChain } from '@renderer/composables/useRunActionChain'
import { ChainAction } from '../../../../types/actions'
import { computed } from 'vue'

const props = defineProps<{
  chainAction: ChainAction
  connectionId: string
  noContextMenu?: boolean
  noGrab?: boolean
  disable?: boolean
}>()

defineEmits(['send', 'edit', 'copy', 'move', 'delete'])

const { running, run } = useRunActionChain()

const waitActionCount = computed(() => {
  return props.chainAction.nodes.filter((node) => node.type === 'wait').length
})

const actionCount = computed(() => {
  return props.chainAction.nodes.filter((node) => node.type === 'action').length
})
</script>

<template>
  <q-card flat class="chain-action-card h-fit p-4">
    <div class="flex justify-between">
      <h2
        class="truncate-hover-one-line drag-handle w-full text-lg"
        :class="{ 'cursor-grab': !noGrab }"
        :title="chainAction.name"
      >
        {{ chainAction.name }}
      </h2>
      <q-btn
        v-if="!noContextMenu"
        class="ml-2"
        icon="fa-solid fa-ellipsis-vertical"
        flat
        round
        size="sm"
      >
        <action-card-context-menu
          @edit="$emit('edit')"
          @copy="$emit('copy')"
          @move="$emit('move')"
          @delete="$emit('delete')"
        />
      </q-btn>
    </div>
    <div class="mt-4 flex justify-between select-none">
      <div class="flex gap-4">
        <div class="color-details flex items-center gap-1.5">
          <span class="text-lg">{{ waitActionCount }}</span>
          <q-icon name="fa-solid fa-clock" size="xs" />
          <q-tooltip class="text-sm whitespace-pre">Wait Nodes</q-tooltip>
        </div>

        <div class="color-details flex items-center gap-1.5">
          <span class="text-lg">{{ actionCount }}</span>
          <q-icon name="fa-solid fa-paper-plane" size="xs" />
          <q-tooltip class="text-sm whitespace-pre">Action Nodes</q-tooltip>
        </div>
      </div>
      <q-btn
        :disable="running || disable"
        color="primary"
        @click="run(connectionId, chainAction.nodes, chainAction.edges)"
      >
        <q-circular-progress
          v-if="running"
          color="white"
          indeterminate
          class="mr-2"
          size="18px"
          :thickness="0.5"
        />
        <q-icon v-else class="mr-2" size="xs" name="fa-solid fa-play" />
        Run
        <q-tooltip v-if="disable" class="bg-primary text-sm text-white">
          Connection is not active.
        </q-tooltip>
      </q-btn>
    </div>

    <action-card-context-menu
      v-if="!noContextMenu"
      context-menu
      anchor="bottom left"
      self="top left"
      @edit="$emit('edit')"
      @copy="$emit('copy')"
      @move="$emit('move')"
      @delete="$emit('delete')"
    />
  </q-card>
</template>

<style scoped lang="less">
.truncate-hover-one-line {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  text-overflow: ellipsis;
  word-break: break-all;
}

.body--light {
  .chain-action-card {
    background-color: #f5f5f5;
  }
}
</style>
