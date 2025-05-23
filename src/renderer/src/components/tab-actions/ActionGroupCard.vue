<script setup lang="ts">
import { computed, ref } from 'vue'
import ActionGroupContextMenu from './ActionGroupContextMenu.vue'

const props = defineProps<{
  title: string
  active?: boolean
  description?: string
  cantModify?: boolean
  notMovable?: boolean
  notDraggable?: boolean
  disableDropZone?: boolean
}>()

const emit = defineEmits<{
  'action:dropped': [actionId: string]
  'export:chain-actions': []
  'export:actions': []
  'export:group': []
  delete: []
  edit: []
  copy: []
  move: []
}>()

const dropZoneActiveAndNotActive = computed(
  () => !props.disableDropZone && dropZoneActive.value && !props.active
)
const dropZoneActive = ref(false)

const setDropZoneActive = (value: boolean) => {
  if (props.active) return

  dropZoneActive.value = value
}

const handleDragEnd = (event: DragEvent) => {
  const actionId = event?.dataTransfer?.getData('actionId')

  setDropZoneActive(false)

  if (!actionId) return

  emit('action:dropped', actionId)
}
</script>

<template>
  <q-card
    class="group-card tw-grid tw-h-fit tw-cursor-pointer tw-p-2 tw-transition-colors hover:tw-bg-primary/50"
    :class="{ active, 'drop-zone': dropZoneActiveAndNotActive }"
    flat
    @dragleave.prevent="setDropZoneActive(false)"
    @dragenter.prevent="setDropZoneActive(true)"
    @dragover.prevent
    @drop.prevent="handleDragEnd"
  >
    <div
      class="tw-pointer-events-none tw-my-1 tw-flex tw-select-none tw-items-start tw-justify-between"
    >
      <div>
        <h2
          class="tw-line-clamp-1 tw-cursor-pointer tw-overflow-hidden tw-text-ellipsis tw-text-lg"
        >
          {{ title }}
        </h2>
        <p class="description color-details tw-line-clamp-3 tw-transition-colors">
          {{ description }}
        </p>
      </div>
      <q-btn
        class="drag-handle tw-pointer-events-auto"
        :class="{ 'tw-cursor-grab': !notDraggable }"
        icon="fa-solid fa-ellipsis-vertical"
        flat
        round
        size="sm"
        @click.stop
      >
        <action-group-context-menu
          :cantModify="cantModify"
          :notMovable="notMovable"
          @edit="$emit('edit')"
          @delete="$emit('delete')"
          @copy="$emit('copy')"
          @move="$emit('move')"
          @export:chain-actions="$emit('export:chain-actions')"
          @export:actions="$emit('export:actions')"
          @export:group="$emit('export:group')"
        />
      </q-btn>
    </div>

    <action-group-context-menu
      context-menu
      anchor="bottom left"
      self="top left"
      :cantModify="cantModify"
      :notMovable="notMovable"
      @edit="$emit('edit')"
      @delete="$emit('delete')"
      @copy="$emit('copy')"
      @move="$emit('move')"
      @export:chain-actions="$emit('export:chain-actions')"
      @export:actions="$emit('export:actions')"
      @export:group="$emit('export:group')"
    />
  </q-card>
</template>

<style scoped lang="less">
.body--dark {
  .group-card {
    @apply tw-bg-neutral-800;
  }

  .group-card.active {
    @apply tw-bg-primary/70 tw-text-white;
  }

  .group-card.active .color-details {
    @apply tw-text-neutral-200;
  }
}

.body--light {
  .group-card {
    @apply tw-bg-neutral-100;
  }

  .group-card.active {
    @apply tw-bg-primary/70 tw-text-white;
  }
  .group-card.active .color-details {
    @apply tw-text-neutral-200;
  }
}

.group-card.drop-zone {
  @apply tw-bg-secondary;
}

.group-card.drop-zone .description {
  @apply tw-text-neutral-100;
}
</style>
