<script setup lang="ts">
import { useAppColorMode } from '@renderer/composables/useAppColorMode'
import { formatCode } from '@renderer/assets/js/format-code'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import _ from 'lodash'

const props = defineProps<{
  value: string
  modifiedValue: string
  language?: 'raw' | 'json' | 'xml' | 'yaml' | string
  sideBySide?: boolean
  hideUnchanged?: boolean
}>()

const { isDark } = useAppColorMode()

const monacoEditorRef = ref<HTMLDivElement | null>(null)

let diffEditor: monaco.editor.IStandaloneDiffEditor | null = null
let models: monaco.editor.ITextModel[] = []

const disposeModels = () => {
  models.forEach((model) => model.dispose())
  models = []
}

const updateModels = _.debounce(
  () => {
    if (!diffEditor) return

    const language = props.language || 'raw'
    const original = monaco.editor.createModel(formatCode(props.value, language), language)
    const modified = monaco.editor.createModel(formatCode(props.modifiedValue, language), language)

    diffEditor.setModel({ original, modified })

    disposeModels()
    models = [original, modified]
  },
  150,
  { leading: true, trailing: true, maxWait: 250 }
)

watch([() => props.value, () => props.modifiedValue, () => props.language], () => updateModels())

watch(
  () => [props.sideBySide, props.hideUnchanged],
  () => {
    diffEditor?.updateOptions({
      renderSideBySide: props.sideBySide,
      hideUnchangedRegions: { enabled: !!props.hideUnchanged }
    })
  }
)

watch(isDark, (dark) => monaco.editor.setTheme(dark ? 'vs-dark-darker' : 'vs-lighter'))

onMounted(() => {
  if (!monacoEditorRef.value) return

  diffEditor = monaco.editor.createDiffEditor(monacoEditorRef.value, {
    theme: isDark.value ? 'vs-dark-darker' : 'vs-lighter',
    overviewRulerLanes: 0,
    fontSize: 13,
    fontFamily: "Consolas, 'Courier New', ui-monospace, monospace",
    readOnly: true,
    originalEditable: false,
    lineNumbers: 'off',
    glyphMargin: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    renderSideBySide: props.sideBySide,
    useInlineViewWhenSpaceIsLimited: false,
    renderOverviewRuler: false,
    hideUnchangedRegions: { enabled: !!props.hideUnchanged },
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6
    }
  })

  updateModels()
})

onBeforeUnmount(() => {
  updateModels.cancel()
  diffEditor?.dispose()
  disposeModels()
})
</script>

<template>
  <div ref="monacoEditorRef" class="h-full w-full overflow-hidden rounded-lg" />
</template>
