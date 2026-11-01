<script setup lang="ts">
import { DEFAULT_GROUP } from '../../tab-actions/action-utils'
import ConnectionSelect from '../../ConnectionSelect.vue'
import { useActionsStore } from '../../../store/actions'
import { computed, ref, watch } from 'vue'

const actionsStore = useActionsStore()

const props = defineProps<{
  title: string
  actionIcon: string
  actionTitle: string
  opened: boolean
  groupId?: string
  formTitle?: string
  connectionId?: string
  formDescription?: string
}>()

const emits = defineEmits<{
  'update:formDescription': [value: string]
  'update:connectionId': [value: string]
  'update:formTitle': [value: string]
  'update:groupId': [value: string]
  'update:opened': [value: boolean]
  input: []
  close: []
}>()

const errors = ref<{ connection?: string; title?: string }>({})

const icon = computed(() =>
  props.actionIcon?.startsWith('i-') ? props.actionIcon : 'i-lucide-plus'
)

const groupItems = computed(() =>
  [DEFAULT_GROUP, ...actionsStore.getConnectionGroups(props.connectionId || '')].map((g) => ({
    label: g.name,
    value: g.id
  }))
)

const handleCloseForm = () => {
  emits('close')
  emits('update:opened', false)
}

const handleSelect = () => {
  errors.value = {
    connection: props.connectionId ? undefined : 'Connection is required',
    title: props.formTitle ? undefined : 'Title is required'
  }

  if (errors.value.connection || errors.value.title) return

  emits('input')
  handleCloseForm()
}

const connectionIdModel = computed<string>({
  get: () => props.connectionId || '',
  set: (value) => {
    emits('update:groupId', 'default')
    emits('update:connectionId', value)
  }
})

const groupIdModel = computed<string>({
  get: () => props.groupId || 'default',
  set: (value) => emits('update:groupId', value)
})

const formTitleModel = computed<string>({
  get: () => props.formTitle || '',
  set: (value) => emits('update:formTitle', value)
})

const formDescriptionModel = computed<string>({
  get: () => props.formDescription || '',
  set: (value) => emits('update:formDescription', value)
})

watch(
  () => props.opened,
  () => (errors.value = {})
)
</script>

<template>
  <UModal
    :open="opened"
    :title="title"
    description="Save this message as a reusable action."
    :ui="{ content: 'sm:max-w-md', footer: 'justify-end' }"
    @update:open="!$event && handleCloseForm()"
  >
    <template #body>
      <form class="flex flex-col gap-4" @submit.prevent="handleSelect">
        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Connection" :error="errors.connection" required>
            <ConnectionSelect v-model="connectionIdModel" class="w-full" />
          </UFormField>
          <UFormField label="Group">
            <USelect v-model="groupIdModel" :items="groupItems" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="Title" :error="errors.title" required>
          <UInput v-model="formTitleModel" class="w-full" autofocus />
        </UFormField>
        <UFormField label="Description">
          <UTextarea v-model="formDescriptionModel" class="w-full" :rows="3" autoresize />
        </UFormField>
        <button type="submit" class="hidden" />
      </form>
    </template>

    <template #footer>
      <UButton color="neutral" variant="outline" label="Cancel" @click="handleCloseForm" />
      <UButton :icon="icon" :label="actionTitle" class="font-semibold" @click="handleSelect" />
    </template>
  </UModal>
</template>
