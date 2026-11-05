<script setup lang="ts">
import {
  ActionForm,
  actionToForm,
  formToAction,
  hasErrors,
  validateActionForm
} from './action-form'
import { defineShortcuts, useOverlay, useToast } from '@nuxt/ui/composables'
import { computed, onActivated, onDeactivated, ref, watch } from 'vue'
import { useSettingsStore } from '@renderer/store/settings-store'
import ConfirmDialog from './dialogs/ConfirmDialog.vue'
import ActionVariablesPanel from './ActionVariablesPanel.vue'
import { useActionsStore } from '@renderer/store/actions'
import { DEFAULT_GROUP, formatTile } from './action-utils'
import ActionFields from './ActionFields.vue'
import ActionTryIt from './ActionTryIt.vue'

const props = defineProps<{
  connectionId: string
  groupId: string
  actionId?: string
}>()

const emit = defineEmits<{
  back: []
  open: [actionId: string]
  create: []
}>()

const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()
const overlay = useOverlay()
const toast = useToast()

const confirmModal = overlay.create(ConfirmDialog)

const group = computed(() =>
  props.groupId === 'default'
    ? DEFAULT_GROUP
    : (actionsStore.getConnectionGroup(props.connectionId, props.groupId) ?? DEFAULT_GROUP)
)

const siblings = computed(() =>
  actionsStore.getConnectionGroupActions(props.connectionId, props.groupId)
)

const action = computed(() => siblings.value.find((a) => a.id === props.actionId))

const form = ref<ActionForm>(actionToForm())
const initial = ref('')
const submitted = ref(false)

const reset = () => {
  form.value = actionToForm(action.value, settingsStore.defaultDataFormat)
  initial.value = JSON.stringify(form.value)
  submitted.value = false
}

watch(() => [props.actionId, props.groupId, props.connectionId], reset, { immediate: true })

const isDirty = computed(() => JSON.stringify(form.value) !== initial.value)

const errors = computed(() => (submitted.value ? validateActionForm(form.value) : {}))

const title = computed(() => action.value?.name || (props.actionId ? 'Action' : 'New action'))

const confirmLeave = async () => {
  if (!isDirty.value) return true

  const instance = confirmModal.open({
    title: 'Discard unsaved changes?',
    description: `Your changes to “${form.value.name || 'this action'}” will be lost.`,
    confirmLabel: 'Discard',
    danger: true
  })

  return !!(await instance.result)
}

const leaveTo = async (navigate: () => void) => {
  if (await confirmLeave()) navigate()
}

const save = () => {
  submitted.value = true
  if (hasErrors(errors.value)) return

  if (action.value) {
    actionsStore.updateAction(
      props.connectionId,
      props.groupId,
      formToAction(form.value, action.value)
    )
    initial.value = JSON.stringify(form.value)
  } else {
    actionsStore.addActionToConnectionGroup(
      formToAction(form.value, { id: 'new', groupId: props.groupId }),
      props.connectionId,
      props.groupId
    )

    const created = siblings.value[siblings.value.length - 1]

    initial.value = JSON.stringify(form.value)
    if (created) emit('open', created.id)
  }

  toast.add({ title: 'Action saved', icon: 'i-lucide-check', color: 'success', duration: 1500 })
}

const remove = async () => {
  if (!action.value) return

  const instance = confirmModal.open({
    title: `Delete “${action.value.name}”?`,
    description: 'This action will be removed from the group.',
    confirmLabel: 'Delete',
    confirmIcon: 'i-lucide-trash-2',
    danger: true
  })

  if (!(await instance.result)) return

  actionsStore.deleteActionFromConnectionGroup(action.value.id, props.connectionId, props.groupId)
  initial.value = JSON.stringify(form.value)
  emit('back')
}

const active = ref(true)
onActivated(() => (active.value = true))
onDeactivated(() => (active.value = false))

defineShortcuts({
  meta_s: {
    usingInput: true,
    handler: () => {
      if (active.value) save()
    }
  }
})

defineExpose({ confirmLeave })
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <nav
      aria-label="Breadcrumb"
      class="border-default flex items-center gap-1.5 border-b px-5 py-2.5 text-[13px]"
    >
      <button
        type="button"
        class="text-muted hover:text-default"
        @click="leaveTo(() => emit('back'))"
      >
        {{ group.name }}
      </button>
      <span class="text-muted">›</span>
      <span class="truncate font-bold">{{ title }}</span>
      <span v-if="isDirty" class="text-warning ml-1.5 flex items-center gap-1.5 text-xs">
        <span class="bg-warning size-1.5 rounded-full" />
        Unsaved changes
      </span>
    </nav>

    <div class="flex min-h-0 flex-1">
      <nav
        :aria-label="`Actions in ${group.name}`"
        class="border-default flex w-[250px] shrink-0 flex-col gap-0.5 overflow-auto border-r px-3 py-4"
      >
        <button
          type="button"
          class="text-muted hover:text-default mb-2 flex h-8 items-center gap-1.5 px-2.5 text-[13px]"
          @click="leaveTo(() => emit('back'))"
        >
          <UIcon name="i-lucide-chevron-left" class="size-3.5" />
          All actions
        </button>
        <div
          class="text-muted truncate px-2.5 pb-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase"
        >
          {{ group.name }}
        </div>
        <button
          v-for="sibling in siblings"
          :key="sibling.id"
          type="button"
          class="flex h-9 shrink-0 items-center gap-2 rounded-md px-2.5 text-[13px]"
          :class="
            sibling.id === actionId
              ? 'bg-primary/10 text-primary font-bold'
              : 'hover:bg-muted font-medium'
          "
          @click="sibling.id !== actionId && leaveTo(() => emit('open', sibling.id))"
        >
          <span
            aria-hidden="true"
            class="border-default flex size-[22px] shrink-0 items-center justify-center rounded-sm border font-mono text-[10px] font-bold"
            :class="formatTile(sibling.payloadFormat).class"
          >
            {{ formatTile(sibling.payloadFormat).glyph }}
          </span>
          <span class="truncate text-left">{{ sibling.name }}</span>
        </button>
        <button
          type="button"
          class="flex h-9 shrink-0 items-center gap-2 rounded-md px-2.5 text-[13px]"
          :class="!actionId ? 'bg-primary/10 text-primary font-bold' : 'text-muted hover:bg-muted'"
          @click="actionId && leaveTo(() => emit('create'))"
        >
          <UIcon name="i-lucide-plus" class="size-3.5" />
          New action
        </button>
      </nav>

      <main class="flex min-w-0 flex-1 flex-col overflow-auto px-7 py-5">
        <ActionFields
          v-model="form"
          class="flex-auto shrink-0"
          :connection-id="connectionId"
          :errors="errors"
          variable-completion
        />
      </main>

      <aside
        aria-label="Variables and test"
        class="border-default flex w-[360px] shrink-0 flex-col gap-[18px] overflow-auto border-l p-5"
      >
        <ActionVariablesPanel v-model:enum-options="form.enumOptions" :payload="form.payload" />
        <ActionTryIt :form="form" :connection-id="connectionId" />
      </aside>
    </div>

    <footer class="border-default flex items-center gap-2 border-t px-5 py-3">
      <UButton
        v-if="action"
        color="neutral"
        variant="outline"
        icon="i-lucide-trash-2"
        label="Delete"
        class="text-muted hover:text-error"
        @click="remove"
      />
      <span class="text-muted ml-auto flex items-center gap-1 text-xs">
        <UKbd value="meta" size="sm" /><UKbd value="S" size="sm" /> to save
      </span>
      <UButton
        color="neutral"
        variant="outline"
        label="Discard"
        :disabled="!isDirty"
        @click="reset"
      />
      <UButton label="Save" class="font-semibold" @click="save" />
    </footer>
  </div>
</template>
