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
  'export:actions': []
  'export:group': []
  addAction: []
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
    class="group-card tw-p-2 tw-h-fit tw-grid hover:tw-bg-primary/50 tw-transition-colors tw-cursor-pointer"
    :class="{ active, 'drop-zone': dropZoneActiveAndNotActive }"
    flat
    @dragleave.prevent="setDropZoneActive(false)"
    @dragenter.prevent="setDropZoneActive(true)"
    @dragover.prevent
    @drop.prevent="handleDragEnd"
  >
    <div
      class="tw-my-1 tw-flex tw-justify-between tw-items-start tw-pointer-events-none tw-select-none"
    >
      <div>
        <h2
          class="tw-text-lg tw-text-ellipsis tw-overflow-hidden tw-line-clamp-1 tw-cursor-pointer"
        >
          {{ title }}
        </h2>
        <p class="description tw-line-clamp-3 tw-transition-colors color-details">
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
          @addAction="$emit('addAction')"
          @edit="$emit('edit')"
          @delete="$emit('delete')"
          @copy="$emit('copy')"
          @move="$emit('move')"
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
      @addAction="$emit('addAction')"
      @edit="$emit('edit')"
      @delete="$emit('delete')"
      @copy="$emit('copy')"
      @move="$emit('move')"
      @export:actions="$emit('export:actions')"
      @export:group="$emit('export:group')"
    />
  </q-card>
</template>

<style scoped lang="less">
.group-card.active {
  @apply tw-bg-primary/70 tw-text-white;
}

.group-card.drop-zone {
  @apply tw-bg-secondary;
}

.group-card.drop-zone .description {
  @apply tw-text-neutral-100;
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
</style>
