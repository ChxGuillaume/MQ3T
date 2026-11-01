<script setup lang="ts">
import { GlyphLine, parseJsonForGlyphs } from '../../assets/js/parse-json-for-glyphs'
import { useAppColorMode } from '@renderer/composables/useAppColorMode'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMqttTopicsStore } from '../../store/mqtt-topics'
import { useDataGraphsStore } from '../../store/data-graphs'
import { formatCode } from '../../assets/js/format-code'
import LineChartCard from '../graphs/LineChartCard.vue'
import * as monaco from 'monaco-editor'
import _ from 'lodash'

const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()
const { isDark } = useAppColorMode()

const props = defineProps<{
  connectionKey?: string
  topicKey?: string
  value: string
  language?: 'raw' | 'json' | 'xml' | 'yaml' | string
  hideTopBorder?: boolean
  hideGlyphs?: boolean
}>()

const glyphMarginClass = 'code-preview-glyph'
let codeEditor: monaco.editor.IStandaloneCodeEditor | null = null
let glyphDecorations: monaco.editor.IEditorDecorationsCollection | null = null

const monacoEditorRef = ref(null)

const currentDataPath = ref('')
const forceShowGraph = ref(false)
const glyphsData = ref<GlyphLine[]>([])
const showGraph = ref(false)
const myGraph = ref<HTMLDivElement | null>(null)
const x = ref(0)
const y = ref(0)

const ySafe = computed(() => {
  const graphCardHeight = myGraph.value?.getBoundingClientRect().height || 0

  return Math.max(10, Math.min(window.innerHeight - graphCardHeight - 10, y.value))
})

const updatePreviewValue = _.debounce(
  (value) => {
    const formatedValue = formatCode(value, props.language || 'raw')
    codeEditor?.setValue(formatedValue)

    if (props.language === 'json') addGlyphs(formatedValue)
  },
  250,
  { leading: true, trailing: true, maxWait: 250 }
)

const decodePathFromClass = (index: string): string | undefined =>
  glyphsData.value[parseInt(index)]?.path

const addGlyphs = (formatedValue: string) => {
  if (props.hideGlyphs || !codeEditor) return

  glyphsData.value = parseJsonForGlyphs(formatedValue)

  glyphDecorations?.clear()
  glyphDecorations = codeEditor.createDecorationsCollection(
    glyphsData.value.map(({ lineNumber }, index) => ({
      range: new monaco.Range(lineNumber, 0, lineNumber, 0),
      options: {
        glyphMarginClassName: [glyphMarginClass, `data-path---${index}`].join(' '),
        glyphMarginHoverMessage: { value: 'Click to add to Graphs' }
      }
    }))
  )
}

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

  const formatedValue = formatCode(props.value, props.language || 'raw')

  codeEditor = monaco.editor.create(monacoEditorRef.value, {
    value: formatedValue,
    language: props.language || 'raw',
    theme: isDark.value ? 'vs-dark-darker' : 'vs-lighter',
    overviewRulerLanes: 0,
    fontSize: 13,
    fontFamily: "Consolas, 'Courier New', ui-monospace, monospace",
    readOnly: true,
    lineNumbers: 'off',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    renderLineHighlight: 'none',
    padding: { top: 12, bottom: 12 },
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6
    },
    glyphMargin: !props.hideGlyphs
  })

  if (props.language === 'json') addGlyphs(formatedValue)

  codeEditor.onMouseDown((e) => {
    const element = e.target.element

    if (!element) return
    if (!checkForGlyphElement(element)) return

    const dataPathClass = getElementDataPathClass(element)
    const dataPath = decodePathFromClass(dataPathClass)

    if (typeof dataPath === 'undefined') return

    dataGraphsStore.addDataGraph({
      clientKey: props.connectionKey || mqttTopicsStore.selectedConnection,
      topic: props.topicKey || mqttTopicsStore.selectedTopic,
      dataPath
    })
  })

  codeEditor.onMouseMove(function (e) {
    const element = e.target.element

    if (!element) return
    if (!checkForGlyphElement(element)) {
      showGraph.value = false
      return
    }

    showGraph.value = true

    const rect = element.getBoundingClientRect()
    const graphRect = myGraph.value?.getBoundingClientRect()

    if (!graphRect) return
    if (graphRect.width === 0) return

    x.value = rect.x - graphRect.width - 10
    y.value = rect.y + rect.height / 2 - graphRect.height / 2

    const dataPathClass = getElementDataPathClass(element)
    const dataPath = decodePathFromClass(dataPathClass)

    if (typeof dataPath === 'undefined') return
    if (dataPath === currentDataPath.value) return

    currentDataPath.value = dataPath
  })

  codeEditor.onMouseLeave(() => {
    setTimeout(() => {
      showGraph.value = false
    }, 100)
  })
})

onBeforeUnmount(() => {
  updatePreviewValue.cancel()
  if (codeEditor) codeEditor.dispose()
})

const getElementDataPathClass = (element: HTMLElement): string => {
  return (
    element.className
      .split(' ')
      .find((t) => t.startsWith('data-path---'))
      ?.replace('data-path---', '') || ''
  )
}

const checkForGlyphElement = (element: HTMLElement | null): boolean => {
  if (!element) return false

  return element.classList.contains(glyphMarginClass)
}
</script>

<template>
  <div
    ref="monacoEditorRef"
    class="h-full w-full outline-0"
    :class="{ 'border-default border-t': !hideTopBorder }"
  />
  <Transition
    enter-active-class="transition-opacity duration-150"
    leave-active-class="transition-opacity duration-150"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="!hideGlyphs && language === 'json'"
      v-show="showGraph || forceShowGraph"
      ref="myGraph"
      class="fixed z-50 w-fit"
      :style="{ left: `${x}px`, top: `${ySafe}px` }"
      @mouseenter="forceShowGraph = true"
      @mouseleave="forceShowGraph = false"
    >
      <line-chart-card
        class="bg-default w-[500px] shadow-lg"
        :data-graph="{
          id: null,
          clientKey: props.connectionKey || mqttTopicsStore.selectedConnection,
          topic: props.topicKey || mqttTopicsStore.selectedTopic,
          dataPath: currentDataPath,
          curveType: 'curve'
        }"
      >
        <template #bottom>
          <div class="text-muted mt-3 text-center text-xs">Click to add to Graphs</div>
        </template>
      </line-chart-card>
    </div>
  </Transition>
</template>

<style>
.code-preview-glyph {
  cursor: pointer;
  border-radius: 9999px;
  background-color: var(--ui-text-dimmed);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 3v16a2 2 0 0 0 2 2h16'/%3E%3Cpath d='m19 9-5 5-4-4-3 3'/%3E%3C/svg%3E")
    center / 12px no-repeat;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 3v16a2 2 0 0 0 2 2h16'/%3E%3Cpath d='m19 9-5 5-4-4-3 3'/%3E%3C/svg%3E")
    center / 12px no-repeat;
  transition: background-color 150ms;
}

.code-preview-glyph:hover {
  background-color: var(--ui-primary);
}
</style>
