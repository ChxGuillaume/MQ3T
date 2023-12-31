<script setup lang="ts">
import { formatCode } from '../../assets/js/format-code'
import { onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { useQuasar } from 'quasar'
import _ from 'lodash'

const $q = useQuasar()

const props = defineProps<{
  value: string
  language?: 'raw' | 'json' | 'xml' | 'yaml' | string
  hideTopBorder?: boolean
}>()

const monacoEditorRef = ref(null)
let codeEditor: monaco.editor.IStandaloneCodeEditor | null = null

const updatePreviewValue = _.debounce(
  (value) => {
    codeEditor?.setValue(formatCode(value, props.language || 'raw'))
  },
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
    language: 'json',
    theme: $q.dark.isActive ? 'vs-dark-darker' : 'vs-lighter',
    overviewRulerLanes: 0,
    fontSize: 12,
    readOnly: true,
    lineNumbers: 'off',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6
    }
  })
})
</script>

<template>
  <div ref="monacoEditorRef" class="monaco-editor" :class="{ 'tw-border-t': !hideTopBorder }" />
</template>

<style scoped lang="less">
.monaco-editor {
  @apply tw-w-full;
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
