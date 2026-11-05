<script setup lang="ts">
import { ActionGroup } from '../../../../../types/actions'
import { useActionsStore } from '../../../store/actions'
import ConnectionSelect from '../../ConnectionSelect.vue'
import { ref, watch } from 'vue'

const props = defineProps<{
  opened: boolean
  connectionId: string
  group?: ActionGroup
}>()

const emits = defineEmits<{
  'update:opened': [value: boolean]
}>()

const actionsStore = useActionsStore()

const selectedConnections = ref<string[]>([])

const handleClose = () => emits('update:opened', false)

const handleSave = () => {
  if (!props.group) return

  actionsStore.setGroupConnections(props.group.id, [
    props.connectionId,
    ...selectedConnections.value
  ])

  handleClose()
}

watch(
  () => props.opened,
  (opened) => {
    if (!opened || !props.group) return

    selectedConnections.value = actionsStore
      .getGroupConnectionIds(props.group.id)
      .filter((id) => id !== props.connectionId)
  },
  { immediate: true }
)
</script>

<template>
  <UModal
    :open="opened"
    title="Share group"
    :description="`“${group?.name}” and everything in it will show up on the selected connections. Edits apply everywhere.`"
    :ui="{ content: 'sm:max-w-md', footer: 'justify-end' }"
    @update:open="!$event && handleClose()"
  >
    <template #body>
      <UFormField label="Connections">
        <ConnectionSelect
          v-model="selectedConnections"
          multiple
          :exclude="[connectionId]"
          class="w-full"
        />
      </UFormField>
    </template>

    <template #footer>
      <UButton color="neutral" variant="ghost" label="Cancel" @click="handleClose" />
      <UButton icon="i-lucide-link" label="Save" @click="handleSave" />
    </template>
  </UModal>
</template>
