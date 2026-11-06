<script setup lang="ts">
import ConnectionSelect from '../../ConnectionSelect.vue'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  connectionId?: string
  actionTitle: string
  actionIcon: string
  opened: boolean
  title: string
  description?: string
  exclude?: string[]
}>()

const emits = defineEmits<{
  'update:connectionId': [value: string]
  'update:opened': [value: boolean]
  input: []
  close: []
}>()

const connectionError = ref<string>()

const icon = computed(() => (props.actionIcon?.startsWith('i-') ? props.actionIcon : undefined))

const connectionIdModel = computed<string>({
  get: () => props.connectionId || '',
  set: (value) => emits('update:connectionId', value)
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
      <UFormField label="Connection" :error="connectionError" required>
        <ConnectionSelect v-model="connectionIdModel" :exclude="exclude" class="w-full" />
      </UFormField>
    </template>

    <template #footer>
      <UButton color="neutral" variant="outline" label="Cancel" @click="handleCloseForm" />
      <UButton :icon="icon" :label="actionTitle" class="font-semibold" @click="handleSelect" />
    </template>
  </UModal>
</template>
