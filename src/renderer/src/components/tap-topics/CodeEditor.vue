<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import { useAppColorMode } from '@renderer/composables/useAppColorMode'
import { findCodeError } from '../../assets/js/format-code'
import * as monaco from 'monaco-editor'
import {
  unregisterCompletionProvider,
  registerCompletionProvider
} from '@renderer/assets/js/init-monaco-editor'
import {
  getPayloadVariablesGrouped,
  actionsVariablesArray,
  maskActionVariables
} from '@renderer/assets/js/actions-variables'

export interface ICodeEditor {
  updateCodeEditorValue: (value: string) => void
  revealError: () => void
}

const LANGUAGES = [
  { label: 'Raw', value: 'raw' },
  { label: 'JSON', value: 'json' },
  { label: 'XML', value: 'xml' },
  { label: 'YAML', value: 'yaml' }
]

const slots = useSlots()
const { isDark } = useAppColorMode()

const hasSlots = computed(() => !!slots['header-left'] || !!slots['header-right'])

const props = defineProps<{
  modelValue: string
  fontSize?: number | string
  language?: 'raw' | 'json' | 'xml' | 'yaml' | string
  hideWarning?: boolean
  variableCompletion?: boolean
  dense?: boolean
  hideOptions?: boolean
  lineNumbers?: boolean
}>()

const emits = defineEmits(['update:modelValue', 'update:language', 'submit'])

const monacoEditorRef = ref(null)
let codeEditor: monaco.editor.IStandaloneCodeEditor | null = null
let errorGlyph: monaco.editor.IEditorDecorationsCollection | null = null

const FORMAT_MARKER_OWNER = 'mq3t-format'

const updateCodeEditorValue = (value: string) => {
  if (!codeEditor) return

  codeEditor.setValue(value)
  emits('update:modelValue', value)
}

const handleFormatCode = () => {
  codeEditor?.getAction('editor.action.formatDocument')?.run()
}

const revealError = () => {
  if (!codeEditor || !codeError.value) return

  const { line, column } = codeError.value

  codeEditor.revealLineInCenter(line)
  codeEditor.setPosition({ lineNumber: line, column })
  codeEditor.focus()
}

defineExpose({ updateCodeEditorValue, formatCode: handleFormatCode, revealError })

watch(isDark, (dark) => {
  if (!codeEditor) return

  monaco.editor.setTheme(dark ? 'vs-dark-darker' : 'vs-lighter')
})

const decoration = ref<string[]>([])

onMounted(() => {
  if (!monacoEditorRef.value) return

  if (props.variableCompletion) registerCompletionProvider()

  codeEditor = monaco.editor.create(monacoEditorRef.value, {
    value: props.modelValue,
    language: props.language || 'raw',
    theme: isDark.value ? 'vs-dark-darker' : 'vs-lighter',
    overviewRulerLanes: 0,
    fontSize: parseInt(props.fontSize as string) || 13,
    fontFamily: "Consolas, 'Courier New', ui-monospace, monospace",
    lineNumbers: props.lineNumbers ? 'on' : 'off',
    lineNumbersMinChars: 3,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 12, bottom: 12 },
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6
    }
  })

  codeEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => emits('submit'))

  errorGlyph = codeEditor.createDecorationsCollection()

  updateCodeEditorOptions(props.language || 'raw')
  updateDecorations()
  updateErrorMarkers()

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

const duplicatesText = computed(
  () =>
    `Duplicated variable names: ${variableTypesGroupedDuplicates.value
      .map((item) => `"${item.name}"`)
      .join(', ')}`
)

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

  codeEditor.updateOptions({ glyphMargin: language !== 'raw' })

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

const codeError = computed(() => {
  if (editorLanguage.value === 'raw') return null

  const source = props.variableCompletion ? maskActionVariables(props.modelValue) : props.modelValue

  return findCodeError(source, editorLanguage.value)
})

const updateErrorMarkers = () => {
  const model = codeEditor?.getModel()

  if (!model) return

  const error = codeError.value

  if (!error) {
    monaco.editor.setModelMarkers(model, FORMAT_MARKER_OWNER, [])
    errorGlyph?.clear()
    return
  }

  const line = Math.min(Math.max(error.line, 1), model.getLineCount())
  const lineEnd = model.getLineMaxColumn(line)
  const column = Math.min(Math.max(error.column, 1), lineEnd)

  monaco.editor.setModelMarkers(model, FORMAT_MARKER_OWNER, [
    {
      severity: monaco.MarkerSeverity.Error,
      message: error.message,
      startLineNumber: line,
      startColumn: column,
      endLineNumber: line,
      endColumn: Math.max(column + 1, lineEnd)
    }
  ])

  errorGlyph?.set([
    {
      range: new monaco.Range(line, 1, line, 1),
      options: {
        glyphMarginClassName: 'mq3t-error-glyph',
        glyphMarginHoverMessage: { value: error.message }
      }
    }
  ])
}

watch(codeError, updateErrorMarkers)

const editorStatus = computed(() => {
  if (editorLanguage.value === 'raw') return 'border-default'
  if (codeError.value) return 'border-error'
  if (variableTypesGroupedDuplicates.value.length) return 'border-warning/60'

  return 'border-success/40'
})
</script>

<template>
  <div class="flex h-full flex-col gap-2">
    <div
      v-if="!hideOptions"
      class="flex flex-wrap items-center gap-2"
      :class="{ 'justify-between': hasSlots }"
    >
      <slot name="header-left" />
      <div class="flex items-center gap-2" :class="hasSlots ? '' : 'w-full justify-between'">
        <USelect v-if="dense" v-model="editorLanguage" :items="LANGUAGES" size="sm" class="w-24" />
        <SegmentedControl v-else v-model="editorLanguage" :items="LANGUAGES" size="sm" />
        <UTooltip
          v-if="variableTypesGroupedDuplicates.length && !hideWarning"
          :text="duplicatesText"
        >
          <span class="text-warning flex items-center gap-1.5 text-xs select-none">
            <UIcon name="i-lucide-triangle-alert" class="size-4" />
            <span v-if="!dense">Duplicate variables</span>
          </span>
        </UTooltip>
        <UTooltip text="Format">
          <UButton
            icon="i-lucide-align-left"
            :label="dense ? undefined : 'Format'"
            color="neutral"
            variant="outline"
            size="sm"
            aria-label="Format"
            :disabled="editorLanguage === 'raw'"
            @click="handleFormatCode"
          />
        </UTooltip>
        <slot name="format-right" />
      </div>
      <slot name="header-right" />
    </div>
    <slot name="between" />
    <div
      ref="monacoEditorRef"
      class="min-h-0 w-full grow overflow-hidden rounded-md border transition-colors"
      :class="editorStatus"
    />
    <button
      v-if="codeError"
      type="button"
      class="text-error bg-error/10 hover:bg-error/15 flex min-w-0 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs transition-colors"
      :title="codeError.message"
      @click="revealError"
    >
      <UIcon name="i-lucide-circle-alert" class="size-3.5 shrink-0" />
      <span class="shrink-0 font-semibold">
        Invalid {{ editorLanguage.toUpperCase() }} · line {{ codeError.line }}, col
        {{ codeError.column }}
      </span>
      <span class="truncate">{{ codeError.message }}</span>
    </button>
  </div>
</template>

<style>
.mq3t-variable-highlight {
  text-decoration-line: underline;
}

.mq3t-error-glyph {
  background-color: var(--ui-error);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' x2='12' y1='8' y2='12'/%3E%3Cline x1='12' x2='12.01' y1='16' y2='16'/%3E%3C/svg%3E")
    center / 14px no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' x2='12' y1='8' y2='12'/%3E%3Cline x1='12' x2='12.01' y1='16' y2='16'/%3E%3C/svg%3E")
    center / 14px no-repeat;
}
</style>
