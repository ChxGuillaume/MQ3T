<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
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

const content = computed(() =>
  [
    props.actionCount ? `${props.actionCount} action${props.actionCount > 1 ? 's' : ''}` : '',
    props.chainActionsCount
      ? `${props.chainActionsCount} chain${props.chainActionsCount > 1 ? 's' : ''}`
      : ''
  ]
    .filter(Boolean)
    .join(' and ')
)

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
  <UModal
    :open="opened"
    title="Delete group"
    :ui="{ content: 'sm:max-w-lg', footer: 'justify-end' }"
    @update:open="!$event && handleCloseForm()"
  >
    <template #body>
      <p class="text-muted text-sm">
        This group still holds <b class="text-default">{{ content }}</b
        >. Move them to the Default group, or delete them with the group?
      </p>
    </template>

    <template #footer>
      <UButton color="neutral" variant="outline" label="Cancel" @click="handleCloseForm" />
      <UButton
        color="error"
        variant="soft"
        icon="i-lucide-trash-2"
        label="Delete all"
        @click="handleDeleteActions"
      />
      <UButton
        icon="i-lucide-folder-input"
        label="Move to Default"
        class="font-semibold"
        @click="handleMoveActions"
      />
    </template>
  </UModal>
</template>
