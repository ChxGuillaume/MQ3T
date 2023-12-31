<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { useQuasar } from 'quasar'

export interface ICodeEditor {
  updateCodeEditorValue: (value: string) => void
}

const $q = useQuasar()

const props = defineProps<{
  modelValue: string
  fontSize?: number | string
  language?: 'raw' | 'json' | 'xml' | 'yaml' | string
}>()

const emits = defineEmits(['update:modelValue'])

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

onMounted(() => {
  if (!monacoEditorRef.value) return

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

  codeEditor.onDidChangeModelContent(() => {
    emits('update:modelValue', codeEditor!.getValue())
  })
})

watch(
  () => props.language,
  (newLanguage) => {
    if (!codeEditor) return

    monaco.editor.setModelLanguage(codeEditor.getModel()!, newLanguage || 'json')
  }
)
</script>

<template>
  <div ref="monacoEditorRef" class="monaco-editor" />
</template>

<style scoped lang="less">
.monaco-editor {
  @apply tw-w-full tw-border-y;
  height: 100%;
}

.body--light {
  .monaco-editor {
    @apply tw-border-black/20;
  }
}

.body--dark {
  .monaco-editor {
    @apply tw-border-white/20;
  }
}
</style>
