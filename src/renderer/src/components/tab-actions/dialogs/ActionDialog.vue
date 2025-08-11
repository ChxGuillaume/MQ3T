<script setup lang="ts">
import { getPayloadVariablesGrouped } from '@renderer/assets/js/actions-variables'
import { useCopyClipboard } from '@renderer/composables/useCopyClipboard'
import CodeEditor, { ICodeEditor } from '../../tap-topics/CodeEditor.vue'
import { useSettingsStore } from '../../../store/settings-store'
import { useActionsStore } from '../../../store/actions'
import { Action } from '../../../../../types/actions'
import { computed, reactive, ref, watch } from 'vue'
import { v4 as uuidV4 } from 'uuid'
import { QForm } from 'quasar'

const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()

const { copy } = useCopyClipboard()

const codeEditorRef = ref<ICodeEditor | null>(null)
const formRef = ref<QForm | null>(null)

const props = defineProps<{
  opened: boolean
  noTitle?: boolean
  noWildcard?: boolean
  editMode?: boolean
  action?: Action
  variableCompletion?: boolean
}>()

const emits = defineEmits<{
  'update:opened': [value: boolean]
  'create:action': [value: Action]
  'update:action': [value: Action]
  close: []
}>()

const editorLanguage = ref<'raw' | 'json' | 'xml' | 'yaml'>(settingsStore.defaultDataFormat)
const showEditor = ref(false)
const form = reactive({
  name: '',
  topic: '',
  qos: 0 as 0 | 1 | 2,
  payload: '',
  retained: false,
  description: '',
  enumOptions: {} as Record<string, (string | number)[]>
})
const enumOptionsCache = ref<Record<string, ('string' | 'number')[]>>({})

const addEnumOption = (enumName: string, type: 'string' | 'number') => {
  if (!form.enumOptions[enumName]) form.enumOptions[enumName] = []
  if (!enumOptionsCache.value[enumName]) enumOptionsCache.value[enumName] = []

  form.enumOptions[enumName].push(type === 'string' ? '' : 0)
  enumOptionsCache.value[enumName].push(type)
}

const removeEnumOption = (enumName: string, index: number) => {
  form.enumOptions[enumName].splice(index, 1)
  enumOptionsCache.value[enumName].splice(index, 1)

  if (!form.enumOptions[enumName].length) delete form.enumOptions[enumName]
  if (!enumOptionsCache.value[enumName].length) delete enumOptionsCache.value[enumName]
}

const rules = computed(() => {
  const extraTopicRules: ((v: string) => true | string)[] = []

  if (props.noWildcard) {
    extraTopicRules.push((v: string) => !v.includes('+') || 'Topic cannot include +')
  }

  return {
    name: [(v: string) => !!v || 'Title is required'],
    topic: [
      (v: string) => !!v || 'Topic is required',
      (v: string) => !v.includes('#') || 'Topic cannot include #',
      (v: string) => !v.endsWith('+') || 'Topic cannot end with +',
      ...extraTopicRules
    ]
  }
})

const hint = computed(() => {
  return props.noWildcard ? 'Topics cannot include + or #' : 'Topics can include + wildcard'
})

const enums = computed(() => {
  const variables = getPayloadVariablesGrouped(form.payload)

  return variables.find((v) => v.type === 'enum')?.variables || []
})

const enumVariableNames = computed(() => {
  const payloadVariablesName = Array.from(new Set(enums.value.map((v) => v.name)))
  const enumOptionsVariableNames = Object.keys(form.enumOptions)

  return [
    ...payloadVariablesName.map((name) => ({ from_payload: true, name })),
    ...enumOptionsVariableNames
      .filter((name) => !payloadVariablesName.includes(name))
      .map((name) => ({ from_payload: false, name }))
  ]
})

const hasEnum = computed(() => {
  return !!enums.value.length
})

const clearForm = () => {
  form.name = ''
  form.topic = ''
  form.qos = 0
  form.payload = ''
  form.retained = false
  form.description = ''
  form.enumOptions = {}

  editorLanguage.value = 'raw'
  enumOptionsCache.value = {}
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
    payloadFormat: editorLanguage.value,
    enumOptions: form.enumOptions
  })

  handleCloseForm()
}

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

    enumOptionsCache.value = Object.fromEntries(
      Object.entries(action.enumOptions || {}).map(([key, value]) => [
        key,
        value.map((v) => (typeof v === 'string' ? 'string' : 'number'))
      ])
    )

    form.enumOptions = action.enumOptions || {}

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
    <q-card flat class="dialog-card" :class="{ 'has-enum': hasEnum }">
      <q-form ref="formRef" class="tw-flex">
        <div class="tw-w-[760px]">
          <q-card-section class="tw-grid tw-gap-2">
            <h2 class="tw-mb-2 tw-text-xl">Action</h2>
            <div
              class="tw-grid tw-gap-4"
              :class="{
                'tw-grid-cols-2': !noTitle,
                'tw-grid-cols-1': noTitle
              }"
            >
              <q-input
                v-if="!noTitle"
                v-model="form.name"
                filled
                label="Title"
                :rules="rules.name"
              />
              <q-input
                v-model="form.topic"
                filled
                label="Topic"
                lazy-rules
                :rules="rules.topic"
                hide-hint
                :hint="hint"
              />
            </div>
            <div class="tw-grid-cols tw-grid tw-gap-4">
              <div class="tw-flex tw-gap-4">
                <div class="tw-flex tw-flex-col tw-items-center tw-gap-2">
                  <q-select
                    v-model="form.qos"
                    :options="[0, 1, 2]"
                    filled
                    label="QoS"
                    class="tw-w-[128px]"
                  />
                  <q-toggle v-model="form.retained" label="Retain" class="tw-pr-3" />
                </div>
                <q-input
                  v-model="form.description"
                  filled
                  label="Description"
                  type="textarea"
                  rows="4"
                  class="action-description tw-flex-grow"
                />
              </div>
            </div>
            <div class="tw-mt-4 tw-h-[300px]">
              <code-editor
                v-if="showEditor"
                ref="codeEditorRef"
                v-model:language="editorLanguage"
                v-model="form.payload"
                :variable-completion="variableCompletion"
                class="tw-h-[300px]"
                font-size="14"
              />
            </div>
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
        </div>
        <q-separator vertical />
        <div class="tw-h-full tw-w-[280px]">
          <q-card-section class="tw-flex tw-h-full tw-flex-col tw-gap-4 tw-overflow-auto">
            <h2 class="tw-text-xl">Enums</h2>
            <div
              v-for="enum_name in enumVariableNames"
              :key="enum_name.name"
              class="tw-flex tw-flex-col tw-gap-2"
            >
              <div class="tw-flex tw-w-full tw-items-center tw-justify-between">
                <div
                  class="tw-flex tw-items-center"
                  @click="copy(enum_name.name, 'Variable Name Copied')"
                >
                  <h3
                    class="tw-line-clamp-1 tw-max-w-48 tw-cursor-default tw-text-lg"
                    :class="{
                      'tw-text-red-500': !enum_name.from_payload,
                      'color-details': enum_name.from_payload
                    }"
                    :title="enum_name.name"
                  >
                    {{ enum_name.name }}
                  </h3>
                  <q-tooltip
                    v-if="!enum_name.from_payload"
                    class="tw-bg-red-500"
                    anchor="center left"
                    self="center right"
                    :offset="[10, 0]"
                  >
                    This variable is not used in the payload
                  </q-tooltip>
                </div>
                <q-btn color="primary" size="xs">
                  <q-icon name="fa-solid fa-plus" size="xs" />
                  <q-tooltip anchor="center left" self="center right" :offset="[5, 0]">
                    Add Option
                  </q-tooltip>
                  <q-menu anchor="bottom right" self="top right" :offset="[0, 5]">
                    <q-list>
                      <q-item
                        v-close-popup
                        clickable
                        @click="addEnumOption(enum_name.name, 'string')"
                      >
                        <q-item-section>
                          <div>
                            <q-icon class="tw-mr-2" name="fa-solid fa-font" />
                            String
                          </div>
                        </q-item-section>
                      </q-item>
                      <q-item
                        v-close-popup
                        clickable
                        @click="addEnumOption(enum_name.name, 'number')"
                      >
                        <q-item-section>
                          <div>
                            <q-icon class="tw-mr-2" name="fa-solid fa-hashtag" />
                            Number
                          </div>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
              <div v-for="(_, index) in form.enumOptions[enum_name.name]" :key="index">
                <q-input
                  v-if="enumOptionsCache[enum_name.name][index] === 'string'"
                  v-model="form.enumOptions[enum_name.name][index]"
                  :label="`Option ${index + 1}`"
                  hide-bottom-space
                  filled
                  dense
                  :rules="[(v: string) => !!v || 'Option is required']"
                >
                  <template #append>
                    <q-btn
                      flat
                      dense
                      size="sm"
                      color="red"
                      icon="fa-solid fa-trash"
                      @click="removeEnumOption(enum_name.name, index)"
                    />
                  </template>
                </q-input>
                <q-input
                  v-else
                  v-model.number="form.enumOptions[enum_name.name][index]"
                  :label="`Option ${index + 1}`"
                  hide-bottom-space
                  filled
                  dense
                  type="number"
                  :rules="[
                    (v: number) => !isNaN(v) || 'Invalid number',
                    (v: number | string) => typeof v === 'number' || 'Invalid number'
                  ]"
                >
                  <template #append>
                    <q-btn
                      flat
                      dense
                      size="sm"
                      color="red"
                      icon="fa-solid fa-trash"
                      @click="removeEnumOption(enum_name.name, index)"
                    />
                  </template>
                </q-input>
              </div>
            </div>
          </q-card-section>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="less">
.action-description {
  @apply tw-resize-none;
}

.dialog-card {
  @apply tw-flex tw-transition-all;
  min-width: 760px;
  overflow: hidden !important;
}

.dialog-card.has-enum {
  min-width: 1040px;
}
</style>

<style lang="less">
.action-description textarea {
  resize: none !important;
}
</style>
