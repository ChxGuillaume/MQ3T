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
  <q-card flat class="chain-action-card tw-h-fit tw-p-4">
    <div class="tw-flex tw-justify-between">
      <h2
        class="truncate-hover-one-line drag-handle tw-w-full tw-text-lg"
        :class="{ 'tw-cursor-grab': !noGrab }"
        :title="chainAction.name"
      >
        {{ chainAction.name }}
      </h2>
      <q-btn
        v-if="!noContextMenu"
        class="tw-ml-2"
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
    <div class="tw-mt-4 tw-flex tw-select-none tw-justify-between">
      <div class="tw-flex tw-gap-4">
        <div class="color-details tw-flex tw-items-center tw-gap-1.5">
          <span class="tw-text-lg">{{ waitActionCount }}</span>
          <q-icon name="fa-solid fa-clock" size="xs" />
          <q-tooltip class="tw-whitespace-pre tw-text-sm">Wait Nodes</q-tooltip>
        </div>

        <div class="color-details tw-flex tw-items-center tw-gap-1.5">
          <span class="tw-text-lg">{{ actionCount }}</span>
          <q-icon name="fa-solid fa-paper-plane" size="xs" />
          <q-tooltip class="tw-whitespace-pre tw-text-sm">Action Nodes</q-tooltip>
        </div>
      </div>
      <q-btn
        :disable="running"
        color="primary"
        @click="run(connectionId, chainAction.nodes, chainAction.edges)"
      >
        <q-circular-progress
          v-if="running"
          color="white"
          indeterminate
          class="tw-mr-2"
          size="18px"
          :thickness="0.5"
        />
        <q-icon v-else class="tw-mr-2" size="xs" name="fa-solid fa-play" />
        Run
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
  @apply tw-line-clamp-1 tw-overflow-hidden tw-text-ellipsis tw-break-all;
}

.body--light {
  .chain-action-card {
    @apply tw-bg-neutral-100;
  }
}
</style>
