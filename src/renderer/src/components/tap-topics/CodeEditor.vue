<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { validCode } from '../../assets/js/format-code'
import * as monaco from 'monaco-editor'
import { useQuasar } from 'quasar'
import {
  unregisterCompletionProvider,
  registerCompletionProvider
} from '@renderer/assets/js/init-monaco-editor'

export interface ICodeEditor {
  updateCodeEditorValue: (value: string) => void
}

const $q = useQuasar()

const props = defineProps<{
  modelValue: string
  fontSize?: number | string
  language?: 'raw' | 'json' | 'xml' | 'yaml' | string
  variableCompletion?: boolean
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

    if (isDark) {
      monaco.editor.setTheme('vs-dark-darker')
    } else {
      monaco.editor.setTheme('vs-lighter')
    }
  }
)

let decoration = ref<string[]>([])
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

const updateDecorations = () => {
  if (!codeEditor) return
  if (!props.variableCompletion) return

  const acceptedList = [
    {
      regex: /\$s\$[a-zA-Z0-9_-]+\$/,
      description: 'This will prompt you to enter a String when executing the Action'
    },
    {
      regex: /\$n\$[a-zA-Z0-9_-]+\$/,
      description: 'This will prompt you to enter a Number when executing the Action'
    },
    {
      regex: /\$b\$[a-zA-Z0-9_-]+\$/,
      description: 'This will prompt you to enter a Boolean when executing the Action'
    },
    {
      regex: /\$uuid\$v4\$/,
      description: 'This will generate a UUID v4 when executing the Action'
    }
  ]
  const editorModel: monaco.editor.ITextModel = codeEditor.getModel()!

  const matcheGroups = acceptedList.map((item) => {
    return {
      description: item.description,
      matches: editorModel.findMatches(
        item.regex.toString().slice(1, -1),
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
</script>

<template>
  <div class="editor">
    <div
      ref="monacoEditorRef"
      class="monaco-editor tw-w-full tw-flex-grow"
      :class="{ 'validation-error': !valideCode, raw: editorLanguage === 'raw' }"
    />
    <div class="options tw-flex tw-justify-between tw-p-3">
      <q-btn-toggle
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
      <q-btn
        color="primary"
        dense
        padding="0px 12px"
        :disable="editorLanguage === 'raw'"
        @click="handleFormatCode"
      >
        <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-align-left" />
        Format
      </q-btn>
    </div>
  </div>
</template>

<style scoped lang="less">
.body--light {
  .monaco-editor.raw,
  .options {
    @apply tw-border-black/20;
  }
}

.body--dark {
  .monaco-editor.raw,
  .options {
    @apply tw-border-white/20;
  }
}

.options {
  @apply tw-border-t-2;
}

.editor {
  @apply tw-flex tw-h-full tw-flex-col-reverse;
}

.monaco-editor {
  @apply tw-w-full tw-overflow-auto tw-border-y-2 tw-border-green-500/40 tw-outline-0 tw-transition-colors;
}

.monaco-editor.validation-error {
  @apply tw-border-red-500/40;
}
</style>

<style lang="less">
.mq3t-variable-highlight {
  @apply tw-underline;
}
</style>
