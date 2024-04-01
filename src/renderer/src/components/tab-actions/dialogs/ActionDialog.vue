<script setup lang="ts">
import CodeEditor, { ICodeEditor } from '../../tap-topics/CodeEditor.vue'
import { formatCode, validCode } from '../../../assets/js/format-code'
import { useSettingsStore } from '../../../store/settings-store'
import { useActionsStore } from '../../../store/actions'
import { Action } from '../../../../../types/actions'
import { computed, reactive, ref, watch } from 'vue'
import DataValidBadge from '../DataValidBadge.vue'
import { v4 as uuidV4 } from 'uuid'
import { QForm } from 'quasar'

const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()

const codeEditorRef = ref<ICodeEditor | null>(null)
const formRef = ref<QForm | null>(null)

const props = defineProps<{
  opened: boolean
  editMode?: boolean
  action?: Action
}>()

const emits = defineEmits<{
  'update:opened': [value: boolean]
  'create:action': [value: Action]
  'update:action': [value: Action]
  close: []
}>()

const editorLanguage = ref<'raw' | 'json' | 'xml'>(settingsStore.defaultDataFormat)
const showEditor = ref(false)
const form = reactive({
  name: '',
  topic: '',
  qos: 0 as 0 | 1 | 2,
  payload: '',
  retained: false,
  description: ''
})

const rules = {
  name: [(v: string) => !!v || 'Title is required'],
  topic: [
    (v: string) => !!v || 'Topic is required',
    (v: string) => !v.includes('#') || 'Topic cannot include #',
    (v: string) => !v.endsWith('+') || 'Topic cannot end with +'
  ]
}

const clearForm = () => {
  form.name = ''
  form.topic = ''
  form.qos = 0
  form.payload = ''
  form.retained = false
  form.description = ''

  editorLanguage.value = 'raw'
}

const handleCloseForm = () => {
  showEditor.value = false
  emits('close')

  setTimeout(() => {
    clearForm()
    emits('update:opened', false)
  }, 250)
}

const validateForm = async (): Promise<boolean> => {
  return (await formRef.value?.validate()) || false
}

const handleCreate = async () => {
  if (!(await validateForm())) return

  emits('create:action', {
    id: `action-${uuidV4()}`,
    groupId: actionsStore.selectedActionGroup,
    name: form.name,
    topic: form.topic,
    qos: form.qos,
    payload: form.payload,
    retained: form.retained,
    description: form.description,
    payloadFormat: editorLanguage.value
  })

  handleCloseForm()
}

const handleUpdate = async () => {
  if (!props.action) return
  if (!(await validateForm())) return

  emits('update:action', {
    id: props.action.id,
    groupId: props.action.groupId,
    name: form.name,
    topic: form.topic,
    qos: form.qos,
    payload: form.payload,
    retained: form.retained,
    description: form.description,
    payloadFormat: editorLanguage.value
  })

  handleCloseForm()
}

const handleFormatCode = () => {
  codeEditorRef.value?.updateCodeEditorValue(formatCode(form.payload, editorLanguage.value))
}

const validDate = computed(() => {
  return validCode(form.payload, editorLanguage.value)
})

watch(
  () => props.opened,
  (opened) => {
    if (!opened) return

    setTimeout(() => {
      showEditor.value = props.opened
    }, 150)
  }
)

watch(
  () => props.opened && props.action,
  (action) => {
    if (!action) return

    form.name = action.name
    form.topic = action.topic
    form.qos = action.qos
    form.payload = action.payload
    form.retained = action.retained
    form.description = action.description!

    editorLanguage.value = action.payloadFormat || 'raw'
  }
)
</script>

<template>
  <q-dialog
    ref="dialogRef"
    :model-value="opened"
    @hide="handleCloseForm"
    @before-hide="showEditor = false"
  >
    <q-card flat class="tw-min-w-[760px]">
      <q-card-section>
        <q-form ref="formRef" class="tw-grid tw-gap-2">
          <h2 class="tw-mb-2 tw-text-xl">Action Group</h2>
          <div class="tw-grid tw-grid-cols-2 tw-gap-4">
            <q-input v-model="form.name" filled label="Title" :rules="rules.name" />
            <q-input
              v-model="form.topic"
              filled
              label="Topic"
              lazy-rules
              :rules="rules.topic"
              hide-hint
              hint="Topics can include + wildcard"
            />
          </div>
          <div class="tw-grid tw-grid-cols-2 tw-gap-4">
            <div class="tw-grid tw-gap-4">
              <div class="tw-flex tw-justify-center tw-items-center tw-gap-4">
                <q-card flat bordered class="tw-inline-block">
                  <q-btn-toggle
                    v-model="editorLanguage"
                    toggle-color="primary"
                    :options="[
                      { label: 'Raw', value: 'raw' },
                      { label: 'JSON', value: 'json' },
                      { label: 'XML', value: 'xml' }
                    ]"
                  />
                </q-card>
                <div class="tw-min-w-[32px]">
                  <data-valid-badge
                    v-if="editorLanguage !== 'raw'"
                    :is-valid="validDate"
                    :language="editorLanguage"
                  />
                </div>
                <q-btn
                  color="primary"
                  :disable="editorLanguage === 'raw'"
                  @click="handleFormatCode"
                >
                  <q-icon size="xs" name="fa-solid fa-align-left" />
                  <q-tooltip class="tw-bg-primary tw-text-sm">Format</q-tooltip>
                </q-btn>
              </div>

              <div class="tw-flex tw-justify-center">
                <q-select
                  v-model="form.qos"
                  :options="[0, 1, 2]"
                  filled
                  dense
                  label="QoS"
                  class="tw-w-[96px]"
                />
                <q-toggle v-model="form.retained" label="Retain" />
              </div>
            </div>
            <q-input
              v-model="form.description"
              filled
              label="Description"
              type="textarea"
              rows="3"
              class="action-description"
            />
          </div>
          <div class="tw-mt-4 tw-h-[300px]">
            <code-editor
              v-if="showEditor"
              v-model="form.payload"
              ref="codeEditorRef"
              class="tw-h-[300px]"
              font-size="14"
              :language="editorLanguage"
            />
          </div>
        </q-form>
      </q-card-section>
      <q-card-actions align="right">
        <div class="tw-flex tw-gap-2">
          <q-btn flat label="Cancel" @click="handleCloseForm" />
          <q-btn v-if="!editMode" color="primary" @click="handleCreate">
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-plus" />
            Create
          </q-btn>
          <q-btn v-else color="primary" @click="handleUpdate">
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-save" />
            Update
          </q-btn>
        </div>
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
