<script setup lang="ts">
import {
  ActionForm,
  actionToForm,
  formToAction,
  hasErrors,
  validateActionForm
} from '../action-form'
import { useSettingsStore } from '../../../store/settings-store'
import ActionVariablesPanel from '../ActionVariablesPanel.vue'
import { useActionsStore } from '../../../store/actions'
import { Action } from '../../../../../types/actions'
import ActionFields from '../ActionFields.vue'
import { computed, ref, watch } from 'vue'
import { v4 as uuidV4 } from 'uuid'

const props = defineProps<{
  opened: boolean
  noTitle?: boolean
  noWildcard?: boolean
  editMode?: boolean
  action?: Action
  connectionId?: string
  variableCompletion?: boolean
}>()

const emits = defineEmits<{
  'update:opened': [value: boolean]
  'create:action': [value: Action]
  'update:action': [value: Action]
  close: []
}>()

const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()

const form = ref<ActionForm>(actionToForm(undefined, settingsStore.defaultDataFormat))
const submitted = ref(false)
const showEditor = ref(false)

const errors = computed(() =>
  submitted.value
    ? validateActionForm(form.value, { noTitle: props.noTitle, noWildcard: props.noWildcard })
    : {}
)

const handleCloseForm = () => {
  showEditor.value = false
  emits('close')
  emits('update:opened', false)
}

const handleSubmit = () => {
  submitted.value = true
  if (hasErrors(errors.value)) return

  if (props.editMode && props.action) {
    emits('update:action', formToAction(form.value, props.action))
  } else {
    emits(
      'create:action',
      formToAction(form.value, {
        id: `action-${uuidV4()}`,
        groupId: actionsStore.selectedActionGroup
      })
    )
  }

  handleCloseForm()
}

watch(
  () => props.opened,
  (opened) => {
    if (!opened) return

    form.value = actionToForm(props.action, settingsStore.defaultDataFormat)
    submitted.value = false

    setTimeout(() => (showEditor.value = props.opened), 150)
  },
  { immediate: true }
)
</script>

<template>
  <UModal
    :open="opened"
    :title="editMode ? 'Edit action' : 'New action'"
    :ui="{ content: 'sm:max-w-[1040px]', body: 'p-0 sm:p-0', footer: 'justify-end' }"
    @update:open="!$event && handleCloseForm()"
  >
    <template #body>
      <div class="flex max-h-[75vh] min-h-0">
        <div class="min-w-0 flex-1 overflow-auto p-5">
          <ActionFields
            v-model="form"
            :connection-id="connectionId"
            :errors="errors"
            :no-title="noTitle"
            :no-wildcard="noWildcard"
            :variable-completion="variableCompletion"
            :show-editor="showEditor"
            editor-class="h-[300px]"
          />
        </div>
        <aside class="border-default w-[300px] shrink-0 overflow-auto border-l p-5">
          <ActionVariablesPanel v-model:enum-options="form.enumOptions" :payload="form.payload" />
        </aside>
      </div>
    </template>

    <template #footer>
      <UButton color="neutral" variant="outline" label="Cancel" @click="handleCloseForm" />
      <UButton
        :icon="editMode ? 'i-lucide-save' : 'i-lucide-plus'"
        :label="editMode ? 'Update' : 'Create'"
        class="font-semibold"
        @click="handleSubmit"
      />
    </template>
  </UModal>
</template>
