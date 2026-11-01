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
    class="group-card hover:bg-primary/50 grid h-fit cursor-pointer p-2 transition-colors"
    :class="{ active, 'drop-zone': dropZoneActiveAndNotActive }"
    flat
    @dragleave.prevent="setDropZoneActive(false)"
    @dragenter.prevent="setDropZoneActive(true)"
    @dragover.prevent
    @drop.prevent="handleDragEnd"
  >
    <div class="pointer-events-none my-1 flex items-start justify-between select-none">
      <div>
        <h2 class="line-clamp-1 cursor-pointer overflow-hidden text-lg text-ellipsis">
          {{ title }}
        </h2>
        <p class="description color-details line-clamp-3 transition-colors">
          {{ description }}
        </p>
      </div>
      <q-btn
        class="drag-handle pointer-events-auto"
        :class="{ 'cursor-grab': !notDraggable }"
        icon="fa-solid fa-ellipsis-vertical"
        flat
        round
        size="sm"
        @click.stop
      >
        <action-group-context-menu
          :cant-modify="cantModify"
          :not-movable="notMovable"
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
      :cant-modify="cantModify"
      :not-movable="notMovable"
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
    background-color: #262626;
  }

  .group-card.active {
    background-color: rgb(101 1 100 / 0.7);
    color: white;
  }

  .group-card.active .color-details {
    color: #e5e5e5;
  }
}

.body--light {
  .group-card {
    background-color: #f5f5f5;
  }

  .group-card.active {
    background-color: rgb(101 1 100 / 0.7);
    color: white;
  }
  .group-card.active .color-details {
    color: #e5e5e5;
  }
}

.group-card.drop-zone {
  background-color: #75e67c;
}

.group-card.drop-zone .description {
  color: #f5f5f5;
}
</style>
