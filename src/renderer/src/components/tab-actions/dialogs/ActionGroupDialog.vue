<script setup lang="ts">
import { ActionGroup } from '../../../../../types/actions'
import { reactive, ref, watch } from 'vue'
import { v4 as uuidV4 } from 'uuid'

const props = defineProps<{
  opened: boolean
  editMode?: boolean
  actionGroup?: ActionGroup
}>()

const emits = defineEmits<{
  'update:opened': [value: boolean]
  'create:actionGroup': [value: ActionGroup]
  'update:actionGroup': [value: ActionGroup]
  close: []
}>()

const form = reactive({ name: '', description: '' })
const nameError = ref<string>()

const handleCloseForm = () => {
  emits('close')
  emits('update:opened', false)
}

const handleSubmit = () => {
  nameError.value = form.name.trim() ? undefined : 'Name is required'
  if (nameError.value) return

  if (props.editMode && props.actionGroup) {
    emits('update:actionGroup', {
      id: props.actionGroup.id,
      name: form.name,
      description: form.description
    })
  } else {
    emits('create:actionGroup', {
      id: `group-${uuidV4()}`,
      name: form.name,
      description: form.description
    })
  }

  handleCloseForm()
}

watch(
  () => props.opened,
  (opened) => {
    if (!opened) return

    form.name = props.actionGroup?.name ?? ''
    form.description = props.actionGroup?.description ?? ''
    nameError.value = undefined
  },
  { immediate: true }
)
</script>

<template>
  <UModal
    :open="opened"
    :title="editMode ? 'Edit group' : 'New group'"
    description="Groups keep related actions and chains together."
    :ui="{ content: 'sm:max-w-md', footer: 'justify-end' }"
    @update:open="!$event && handleCloseForm()"
  >
    <template #body>
      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <UFormField label="Name" :error="nameError" required>
          <UInput v-model="form.name" class="w-full" autofocus />
        </UFormField>
        <UFormField label="Description">
          <UTextarea v-model="form.description" class="w-full" :rows="3" autoresize />
        </UFormField>
        <button type="submit" class="hidden" />
      </form>
    </template>

    <template #footer>
      <UButton color="neutral" variant="outline" label="Cancel" @click="handleCloseForm" />
      <UButton
        :label="editMode ? 'Save' : 'Create group'"
        class="font-semibold"
        @click="handleSubmit"
      />
    </template>
  </UModal>
</template>
