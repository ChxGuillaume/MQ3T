<script setup lang="ts">
import ConnectionSelect from '../../ConnectionSelect.vue'
import { useActionsStore } from '../../../store/actions'
import { DEFAULT_GROUP } from '../action-utils'
import { computed, ref, watch } from 'vue'

const actionsStore = useActionsStore()

const props = defineProps<{
  title: string
  actionIcon: string
  actionTitle: string
  opened: boolean
  groupId?: string
  connectionId?: string
  description?: string
}>()

const emits = defineEmits<{
  'update:opened': [value: boolean]
  'update:groupId': [value: string]
  'update:connectionId': [value: string]
  input: []
  close: []
}>()

const connectionError = ref<string>()

const icon = computed(() => (props.actionIcon?.startsWith('i-') ? props.actionIcon : undefined))

const groupItems = computed(() =>
  [DEFAULT_GROUP, ...actionsStore.getConnectionGroups(props.connectionId || '')].map((g) => ({
    label: g.name,
    value: g.id
  }))
)

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

const handleCloseForm = () => {
  emits('close')
  emits('update:opened', false)
}

const handleSelect = () => {
  connectionError.value = props.connectionId ? undefined : 'Connection is required'
  if (connectionError.value) return

  emits('input')
  handleCloseForm()
}

watch(
  () => props.opened,
  () => (connectionError.value = undefined)
)
</script>

<template>
  <UModal
    :open="opened"
    :title="title"
    :description="description"
    :ui="{ content: 'sm:max-w-md', footer: 'justify-end' }"
    @update:open="!$event && handleCloseForm()"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField label="Connection" :error="connectionError" required>
          <ConnectionSelect v-model="connectionIdModel" class="w-full" />
        </UFormField>
        <UFormField label="Group">
          <USelect v-model="groupIdModel" :items="groupItems" class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UButton color="neutral" variant="outline" label="Cancel" @click="handleCloseForm" />
      <UButton :icon="icon" :label="actionTitle" class="font-semibold" @click="handleSelect" />
    </template>
  </UModal>
</template>
