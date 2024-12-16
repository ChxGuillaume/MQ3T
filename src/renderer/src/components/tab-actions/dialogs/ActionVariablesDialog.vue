<script setup lang="ts">
import { actionsVariables, getPayloadVariablesGrouped } from '@renderer/assets/js/actions-variables'
import CodePreview from '@renderer/components/tap-topics/CodePreview.vue'
import SplitterIcon from '@renderer/components/SplitterIcon.vue'
import { useActionsStore } from '@renderer/store/actions'
import { Action } from '../../../../../types/actions'
import { computed, ref, watch } from 'vue'
import { v4 as uuidV4 } from 'uuid'
import { QForm } from 'quasar'

const actionsStore = useActionsStore()

const formRef = ref<QForm | null>(null)
const showEditor = ref(false)

const opened = defineModel('opened', {
  type: Boolean,
  default: false
})

const props = defineProps<{
  action: Action
  connectionId: string
}>()

const emit = defineEmits<{
  send: []
}>()

const form = ref({})

const clearForm = () => {
  form.value = {}
}

const handleCloseForm = () => {
  showEditor.value = false
  opened.value = false
  clearForm()
}

const validateForm = async (): Promise<boolean> => {
  return (await formRef.value?.validate()) || false
}

const handleSend = async () => {
  if (!(await validateForm())) return

  emit('send')

  const actionCopy = { ...props.action, payload: transformedPayload.value }

  actionsStore.sendAction(props.connectionId, actionCopy)

  handleCloseForm()
}

const variablesGroups = computed(() => {
  return getPayloadVariablesGrouped(props.action.payload)
})

const getVariableTypeTitle = (type: string) => {
  switch (type) {
    case 'string':
      return 'String variables'
    case 'number':
      return 'Number variables'
    case 'boolean':
      return 'Boolean variables'
    default:
      return 'Unknown variables'
  }
}

const transformedPayload = ref('')
const transformPayload = () => {
  const keys = Object.keys(form.value)
    .map((key) => ({
      key,
      index: parseInt(key.split(':')[0]),
      variable: key.split(':')[1]
    }))
    .sort((a, b) => a.index - b.index)

  let result = props.action.payload

  for (const key of keys) {
    let value = form.value[key.key]
    if (props.action.payloadFormat === 'json') value = JSON.stringify(value)

    result = result.replace(key.variable, value)
  }

  let value = uuidV4()
  if (props.action.payloadFormat === 'json') value = JSON.stringify(uuidV4())

  result = result.replace(actionsVariables.uuidV4.regex, value)

  transformedPayload.value = result
}

watch(
  () => form.value,
  () => {
    transformPayload()
  },
  { deep: true }
)

watch(
  () => opened.value,
  (opened) => {
    if (!opened) return

    variablesGroups.value.forEach((group) => {
      group.variables.forEach((variable, index) => {
        switch (group.type) {
          case 'string':
            form.value[`${index}:${variable.full}`] = ''
            break
          case 'number':
            form.value[`${index}:${variable.full}`] = 0
            break
          case 'boolean':
            form.value[`${index}:${variable.full}`] = false
            break
        }
      })
    })

    transformPayload()

    setTimeout(() => {
      showEditor.value = opened
    }, 150)
  }
)

const codeEditorSplitter = ref(500)
const codeEditorLimits = ref([400, 700])
</script>

<template>
  <q-dialog ref="dialogRef" v-model="opened" @hide="handleCloseForm" full-width>
    <q-card flat class="action-variables-card">
      <q-form ref="formRef" @submit="handleSend">
        <q-splitter
          v-model="codeEditorSplitter"
          :limits="codeEditorLimits"
          unit="px"
          class="tw-h-96"
        >
          <template #before>
            <div class="tw-max-h-fit tw-overflow-auto">
              <q-card-section>
                <h2 class="tw-line-clamp-1 tw-text-lg">{{ props.action.name }}</h2>
                <span class="tw-caption-top tw-text-neutral-500">{{ props.action.topic }}</span>
              </q-card-section>
              <q-card-section class="tw-grid tw-gap-6 tw-pt-0">
                <div v-for="variableGroup in variablesGroups" :key="variableGroup.type">
                  <h2 class="tw-text-base">{{ getVariableTypeTitle(variableGroup.type) }}</h2>
                  <div
                    class="tw-mt-2 tw-grid tw-gap-2"
                    :class="{ 'tw-grid-cols-2': variableGroup.type !== 'string' }"
                  >
                    <q-input
                      v-if="variableGroup.type === 'string'"
                      v-for="(variable, index) in variableGroup.variables"
                      :model-value="form[`${index}:${variable.full}`]"
                      :label="variable.name"
                      debounce="50"
                      filled
                      dense
                      @keydown.enter.prevent="handleSend"
                      @update:model-value="form[`${index}:${variable.full}`] = $event"
                    >
                      <template #append>
                        <q-checkbox
                          :model-value="form[`${index}:${variable.full}`] === null"
                          @update:model-value="
                            form[`${index}:${variable.full}`] = $event ? null : ''
                          "
                        >
                          <q-tooltip :offset="[0, 0]">Set to null</q-tooltip>
                        </q-checkbox>
                      </template>
                    </q-input>
                    <q-input
                      v-else-if="variableGroup.type === 'number'"
                      v-for="(variable, index) in variableGroup.variables"
                      :model-value="form[`${index}:${variable.full}`]"
                      :label="variable.name"
                      debounce="50"
                      type="number"
                      filled
                      dense
                      @keydown.enter.prevent="handleSend"
                      @update:model-value="
                        form[`${index}:${variable.full}`] = parseInt(($event as string) || '0')
                      "
                    >
                      <template #append>
                        <q-checkbox
                          :model-value="form[`${index}:${variable.full}`] === null"
                          @update:model-value="
                            form[`${index}:${variable.full}`] = $event ? null : 0
                          "
                        >
                          <q-tooltip :offset="[0, 0]">Set to null</q-tooltip>
                        </q-checkbox>
                      </template>
                    </q-input>
                    <q-toggle
                      v-for="(variable, index) in variableGroup.variables"
                      v-else-if="variableGroup.type === 'boolean'"
                      :model-value="form[`${index}:${variable.full}`] || false"
                      :label="variable.name"
                      dense
                      @update:model-value="form[`${index}:${variable.full}`] = $event"
                    />
                  </div>
                </div>
              </q-card-section>
            </div>
          </template>

          <template #separator>
            <splitter-icon @click:double="codeEditorSplitter = 500" vertical />
          </template>

          <template #after>
            <q-card-section class="tw-h-full tw-w-full tw-grow tw-p-0">
              <code-preview
                v-if="showEditor"
                :value="transformedPayload"
                :language="action.payloadFormat"
                hide-top-border
                hide-glyphs
              />
            </q-card-section>
          </template>
        </q-splitter>

        <q-separator class="tw-col-span-2" />

        <q-card-actions class="tw-col-span-2" align="right">
          <div class="tw-flex tw-gap-2">
            <q-btn flat label="Cancel" @click="handleCloseForm" />
            <q-btn color="primary" type="submit">
              <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-paper-plane" />
              Send
            </q-btn>
          </div>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="less">
.action-variables-card {
  max-width: 1000px !important;
}
</style>
