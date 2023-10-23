<script setup lang="ts">
import { QForm } from 'quasar'

const props = defineProps<{
  opened: boolean
  actionCount: number
}>()

const emits = defineEmits<{
  'update:opened': [value: boolean]
  'actions:delete': []
  'actions:move': []
  close: []
}>()

const handleCloseForm = () => {
  emits('close')
  emits('update:opened', false)
}

const handleDeleteActions = () => {
  emits('actions:delete')
  handleCloseForm()
}

const handleMoveActions = () => {
  emits('actions:move')
  handleCloseForm()
}
</script>

<template>
  <q-dialog ref="dialogRef" :model-value="opened" @hide="handleCloseForm">
    <q-card flat class="tw-w-[550px]">
      <q-card-section>
        <q-form ref="formRef" class="tw-grid tw-gap-2">
          <h2 class="tw-mb-2 tw-text-xl">Move Actions</h2>
          <p class="color-details">
            Move the <span class="tw-text-white">{{ actionCount }}</span> actions from the group you
            are deleting to the default group.
          </p>
        </q-form>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn color="red" flat @click="handleDeleteActions">
          <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-trash" />
          Delete Actions
        </q-btn>
        <q-btn color="primary" @click="handleMoveActions">
          <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-paper-plane" />
          Move Actions
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="less">
.action-description {
  @apply tw-resize-none;
}
</style>

<style lang="less">
.action-description textarea {
  resize: none !important;
}
</style>
