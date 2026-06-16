<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import { validCode } from '../../assets/js/format-code'
import * as monaco from 'monaco-editor'
import { useQuasar } from 'quasar'
import {
  unregisterCompletionProvider,
  registerCompletionProvider
} from '@renderer/assets/js/init-monaco-editor'
import {
  getPayloadVariablesGrouped,
  actionsVariablesArray
} from '@renderer/assets/js/actions-variables'

export interface ICodeEditor {
  updateCodeEditorValue: (value: string) => void
}

const $q = useQuasar()
const slots = useSlots()

const hasSlots = computed(() => !!slots['header-left'] || !!slots['header-right'])

const props = defineProps<{
  modelValue: string
  fontSize?: number | string
  language?: 'raw' | 'json' | 'xml' | 'yaml' | string
  hideWarning?: boolean
  variableCompletion?: boolean
  dense?: boolean
}>()

const emits = defineEmits(['update:modelValue', 'update:language'])

const monacoEditorRef = ref(null)
let codeEditor: monaco.editor.IStandaloneCodeEditor | null = null

const updateCodeEditorValue = (value: string) => {
  if (!codeEditor) return

  codeEditor.setValue(value)
  emits('update:modelValue', value)
}

defineExpose({ updateCodeEditorValue })

watch(
  () => $q.dark.isActive,
  (isDark) => {
    if (!codeEditor) return

    if (isDark) monaco.editor.setTheme('vs-dark-darker')
    else monaco.editor.setTheme('vs-lighter')
  }
)

const decoration = ref<string[]>([])
onMounted(() => {
  if (!monacoEditorRef.value) return

  if (props.variableCompletion) registerCompletionProvider()

  codeEditor = monaco.editor.create(monacoEditorRef.value, {
    value: props.modelValue,
    language: props.language || 'raw',
    theme: $q.dark.isActive ? 'vs-dark-darker' : 'vs-lighter',
    overviewRulerLanes: 0,
    fontSize: parseInt(props.fontSize as string) || 12,
    lineNumbers: 'off',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6
    }
  })

  updateCodeEditorOptions(props.language || 'raw')
  updateDecorations()

  codeEditor.onDidChangeModelContent(() => {
    emits('update:modelValue', codeEditor!.getValue())
    updateDecorations()
  })
})

const variableTypesGrouped = computed(() => {
  if (!props.variableCompletion) return []

  return getPayloadVariablesGrouped(props.modelValue)
    .map((item) => item.variables)
    .flat()
})

const variableTypesGroupedDuplicates = computed(() => {
  return variableTypesGrouped.value.filter(
    (item, index, self) => self.findIndex((t) => t.name === item.name) !== index
  )
})

const updateDecorations = () => {
  if (!codeEditor) return
  if (!props.variableCompletion) return
  const editorModel: monaco.editor.ITextModel = codeEditor.getModel()!

  const matcheGroups = actionsVariablesArray.map((item) => {
    return {
      description: item.description,
      matches: editorModel.findMatches(
        item.regex.toString().slice(1, -2),
        false,
        true,
        true,
        null,
        false
      )
    }
  })

  decoration.value = editorModel.deltaDecorations(
    decoration.value,
    matcheGroups
      .flat()
      .map((matchGroup): monaco.editor.IModelDeltaDecoration[] => {
        return matchGroup.matches.map((match) => ({
          range: match.range,
          options: {
            isWholeLine: false,
            inlineClassName: `mq3t-variable-highlight`,
            hoverMessage: { value: matchGroup.description }
          }
        }))
      })
      .flat()
  )
}

onBeforeUnmount(() => {
  if (codeEditor) codeEditor.dispose()
  unregisterCompletionProvider()
})

watch(
  () => props.language,
  (newLanguage) => {
    if (!codeEditor) return

    const language = newLanguage || 'json'

    monaco.editor.setModelLanguage(codeEditor.getModel()!, language)

    updateCodeEditorOptions(language)
  }
)

const updateCodeEditorOptions = (language: string) => {
  if (!codeEditor) return

  switch (language) {
    case 'yaml':
      codeEditor.updateOptions({ quickSuggestions: { strings: true } })
      break
    default:
      codeEditor.updateOptions({ quickSuggestions: { strings: false } })
      break
  }
}

const editorLanguage = computed({
  get: () => props.language || 'raw',
  set: (value) => {
    emits('update:modelValue', codeEditor!.getValue())
    emits('update:language', value)

    monaco.editor.setModelLanguage(codeEditor!.getModel()!, value)
  }
})

const handleFormatCode = () => {
  codeEditor?.getAction('editor.action.formatDocument')?.run()
}

const valideCode = computed(() => {
  return validCode(props.modelValue, editorLanguage.value)
})

const editorStatus = computed(() => {
  if (editorLanguage.value === 'raw') return 'raw'
  if (!valideCode.value) return 'validation-error'
  if (variableTypesGroupedDuplicates.value.length) return 'validation-warning'

  return ''
})
</script>

<template>
  <div class="editor">
    <div ref="monacoEditorRef" class="monaco-editor tw:w-full tw:grow" :class="editorStatus" />
    <slot name="between" />
    <div
      class="options tw:flex tw:items-center tw:p-3"
      :class="{ 'tw:py-1.5': dense, 'tw:justify-between': hasSlots }"
    >
      <slot name="header-left" />
      <div
        class="tw:flex tw:items-center tw:gap-2"
        :class="hasSlots ? '' : 'tw:w-full tw:justify-between'"
      >
        <q-select
          v-if="dense"
          v-model="editorLanguage"
          class="tw:min-w-24"
          dense
          filled
          options-dense
          :options="[
            { label: 'Raw', value: 'raw' },
            { label: 'JSON', value: 'json' },
            { label: 'XML', value: 'xml' },
            { label: 'YAML', value: 'yaml' }
          ]"
          emit-value
          map-options
        />
        <q-btn-toggle
          v-else
          v-model="editorLanguage"
          toggle-color="primary"
          unelevated
          dense
          padding="4px 12px"
          :options="[
            { label: 'Raw', value: 'raw' },
            { label: 'JSON', value: 'json' },
            { label: 'XML', value: 'xml' },
            { label: 'YAML', value: 'yaml' }
          ]"
        />
        <div v-if="!valideCode && !hideWarning" class="tw:flex tw:select-none items-center">
          <q-icon class="tw:mr-2" size="xs" name="fa-solid fa-exclamation-circle" color="red" />
          <span v-if="!dense">Invalid {{ editorLanguage.toUpperCase() }} format</span>
          <q-tooltip v-else anchor="top middle" self="bottom middle">
            Invalid {{ editorLanguage.toUpperCase() }} format
          </q-tooltip>
        </div>
        <div
          v-else-if="variableTypesGroupedDuplicates.length && !hideWarning"
          class="tw:flex tw:select-none items-center"
        >
          <q-icon
            class="tw:mr-2"
            size="xs"
            name="fa-solid fa-exclamation-triangle"
            color="yellow"
          />
          <span v-if="!dense">Duplicate variables</span>
          <q-tooltip anchor="top middle" self="bottom middle">
            <div>
              <div class="tw:text-sm tw:font-semibold">Variable duplicates</div>
              <div class="tw:text-xs">
                The following variables names are duplicated: <br />
                {{ variableTypesGroupedDuplicates.map((item) => `"${item.name}"`).join(', ') }}
              </div>
            </div>
          </q-tooltip>
        </div>
        <q-btn
          v-if="dense"
          dense
          color="primary"
          :disable="editorLanguage === 'raw'"
          @click="handleFormatCode"
        >
          <q-icon class="tw:mx-2" size="16px" name="fa-solid fa-align-left" />
          <q-tooltip anchor="top middle" self="bottom middle">Format</q-tooltip>
        </q-btn>
        <q-btn
          v-else
          color="primary"
          dense
          padding="10px 12px"
          :disable="editorLanguage === 'raw'"
          @click="handleFormatCode"
        >
          <q-icon class="tw:mr-2" size="xs" name="fa-solid fa-align-left" />
          Format
        </q-btn>
        <slot name="format-right" />
      </div>
      <slot name="header-right" />
    </div>
  </div>
</template>

<style scoped lang="less">
.body--light {
  .monaco-editor.raw,
  .options {
    border-color: rgb(0 0 0 / 0.2);
  }
}

.body--dark {
  .monaco-editor.raw,
  .options {
    border-color: rgb(255 255 255 / 0.2);
  }
}

.options {
  border-top-width: 2px;
}

.editor {
  display: flex;
  height: 100%;
  flex-direction: column-reverse;
  overflow-y: auto;
}

.monaco-editor {
  width: 100%;
  overflow: auto;
  border-top-width: 2px;
  border-bottom-width: 2px;
  border-color: rgb(34 197 94 / 0.4);
  outline-width: 0;
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.monaco-editor.validation-error {
  border-color: rgb(239 68 68 / 0.4);
}

.monaco-editor.validation-warning {
  border-color: rgb(234 179 8 / 0.4);
}
</style>

<style lang="less">
.mq3t-variable-highlight {
  text-decoration-line: underline;
}
</style>
