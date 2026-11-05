<script setup lang="ts">
import { useAppColorMode } from '@renderer/composables/useAppColorMode'
import { disableCommandPalette } from '../../assets/js/monaco-preview'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatCode } from '../../assets/js/format-code'
import * as monaco from 'monaco-editor'
import _ from 'lodash'

const { isDark } = useAppColorMode()

const props = defineProps<{
  value: string
  language?: 'raw' | 'json' | 'xml' | 'yaml' | string
  hideTopBorder?: boolean
}>()

let codeEditor: monaco.editor.IStandaloneCodeEditor | null = null

const monacoEditorRef = ref(null)

const updatePreviewValue = _.debounce(
  (value) => codeEditor?.setValue(formatCode(value, props.language || 'raw')),
  250,
  { leading: true, trailing: true, maxWait: 250 }
)

watch(
  () => props.value,
  (newValue) => {
    if (!codeEditor) return

    updatePreviewValue(newValue)
  }
)

watch(isDark, (dark) => {
  if (!codeEditor) return

  monaco.editor.setTheme(dark ? 'vs-dark-darker' : 'vs-lighter')
})

watch(
  () => props.language,
  (newLanguage) => {
    if (!codeEditor) return

    monaco.editor.setModelLanguage(codeEditor.getModel()!, newLanguage || 'json')
  }
)

onMounted(() => {
  if (!monacoEditorRef.value) return

  codeEditor = monaco.editor.create(monacoEditorRef.value, {
    value: formatCode(props.value, props.language || 'raw'),
    language: props.language || 'raw',
    theme: isDark.value ? 'vs-dark-darker' : 'vs-lighter',
    overviewRulerLanes: 0,
    fontSize: 13,
    fontFamily: "Consolas, 'Courier New', ui-monospace, monospace",
    readOnly: true,
    lineNumbers: 'off',
    lineDecorationsWidth: 4,
    contextmenu: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    renderLineHighlight: 'none',
    padding: { top: 12, bottom: 12 },
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6
    },
    glyphMargin: false
  })

  disableCommandPalette(codeEditor)
})

onBeforeUnmount(() => {
  updatePreviewValue.cancel()
  if (codeEditor) codeEditor.dispose()
})
</script>

<template>
  <div
    ref="monacoEditorRef"
    class="h-full w-full outline-0"
    :class="{ 'border-default border-t': !hideTopBorder }"
  />
</template>
