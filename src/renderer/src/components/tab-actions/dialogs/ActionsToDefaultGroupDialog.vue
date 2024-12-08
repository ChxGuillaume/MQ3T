<script setup lang="ts">
import { QForm } from 'quasar'

defineProps<{
  opened: boolean
  actionCount: number
  chainActionsCount: number
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
            You have
            <span v-if="actionCount" class="tw-text-white">{{ actionCount }} actions</span>

            <span v-if="actionCount && chainActionsCount" class="tw-mx-1">and</span>

            <span v-if="chainActionsCount" class="tw-text-white">
              {{ chainActionsCount }} chain actions
            </span>

            in the group you are deleting.

            <br />

            Do you want to move them to the default group?
          </p>
        </q-form>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn color="red" flat @click="handleDeleteActions">
          <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-trash" />
          Delete
        </q-btn>
        <q-btn color="primary" @click="handleMoveActions">
          <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-paper-plane" />
          Move
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
