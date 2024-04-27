<script setup lang="ts">
import { parseJsonForGlyphs } from '../../assets/js/parse-json-for-glyphs'
import { useMqttTopicsStore } from '../../store/mqtt-topics'
import { useDataGraphsStore } from '../../store/data-graphs'
import { formatCode } from '../../assets/js/format-code'
import LineChartCard from '../graphs/LineChartCard.vue'
import { onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { useQuasar } from 'quasar'
import _ from 'lodash'

const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()

const $q = useQuasar()

const props = defineProps<{
  value: string
  language?: 'raw' | 'json' | 'xml' | 'yaml' | string
  hideTopBorder?: boolean
}>()

const glyphMarginClass = 'code-preview-glyph'
let codeEditor: monaco.editor.IStandaloneCodeEditor | null = null

const monacoEditorRef = ref(null)

const currentDataPath = ref('')
const forceShowGraph = ref(false)
const showGraph = ref(false)
const myGraph = ref<HTMLDivElement | null>(null)
const x = ref(0)
const y = ref(0)

const updatePreviewValue = _.debounce(
  (value) => {
    const formatedValue = formatCode(value, props.language || 'raw')
    codeEditor?.setValue(formatedValue)

    if (props.language === 'json') addGlyphs(formatedValue)
  },
  250,
  { leading: true, trailing: true, maxWait: 250 }
)

const encodePathToClass = (path: string): string =>
  path.replace(/\./g, '_-_').replace(/\[/g, '_--_').replace(/]/g, '_---_')
const decodePathFromClass = (path: string): string =>
  path.replace(/---_/g, ']').replace(/--/g, '[').replace(/-/g, '.').replace(/_/g, '')

const addGlyphs = (formatedValue: string) => {
  const positions = parseJsonForGlyphs(formatedValue)

  codeEditor?.createDecorationsCollection(
    positions.map((lineNumber) => ({
      range: new monaco.Range(lineNumber.lineNumber, 0, lineNumber.lineNumber, 0),
      options: {
        glyphMarginClassName: [
          glyphMarginClass,
          `data-path---${encodePathToClass(lineNumber.path)}`,
          'fa-solid fa-chart-line'
        ].join(' ')
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

watch(
  () => $q.dark.isActive,
  (isDark) => {
    if (!codeEditor) return

    if (isDark) monaco.editor.setTheme('vs-dark-darker')
    else monaco.editor.setTheme('vs-lighter')
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

  const formatedValue = formatCode(props.value, props.language || 'raw')

  codeEditor = monaco.editor.create(monacoEditorRef.value, {
    value: formatedValue,
    language: props.language || 'raw',
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
    },
    glyphMargin: true
  })

  if (props.language === 'json') addGlyphs(formatedValue)

  codeEditor.onMouseDown((e) => {
    const element = e.target.element

    if (!element) return
    if (!checkForGlyphElement(element)) return

    const dataPathClass = getElementDataPathClass(element)
    const dataPath = decodePathFromClass(dataPathClass)

    dataGraphsStore.addDataGraph({
      clientKey: mqttTopicsStore.selectedConnection,
      topic: mqttTopicsStore.selectedTopic,
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
    if (graphRect.width === 0 || graphRect.width === 0) return

    x.value = rect.x - graphRect.width - 10
    y.value = rect.y + rect.height / 2 - graphRect.height / 2

    const dataPathClass = getElementDataPathClass(element)
    const dataPath = decodePathFromClass(dataPathClass)

    if (dataPath === currentDataPath.value) return

    currentDataPath.value = decodePathFromClass(dataPath)
  })

  codeEditor.onMouseLeave(() => {
    setTimeout(() => {
      showGraph.value = false
    }, 100)
  })
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
  <div ref="monacoEditorRef" class="monaco-editor" :class="{ 'tw-border-t': !hideTopBorder }" />
  <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
    <div
      ref="myGraph"
      v-if="language === 'json'"
      v-show="showGraph || forceShowGraph"
      class="tw-fixed tw-w-fit"
      :style="{ top: `${y}px`, left: `${x}px` }"
      @mouseenter="forceShowGraph = true"
      @mouseleave="forceShowGraph = false"
    >
      <line-chart-card
        class="tw-w-[500px]"
        :data-graph="{
          id: null,
          clientKey: mqttTopicsStore.selectedConnection,
          topic: mqttTopicsStore.selectedTopic,
          dataPath: currentDataPath,
          curveType: 'curve'
        }"
      >
        <template #bottom>
          <div class="tw-mt-3 tw-text-center color-details">Click to add widget</div>
        </template>
      </line-chart-card>
    </div>
  </transition>
</template>

<style lang="less">
.code-preview-glyph {
  @apply tw-transition-colors tw-rounded-full;
  font-size: 10px;
}

.body--dark {
  .code-preview-glyph {
    @apply tw-text-white;
  }
}

.body--light {
  .code-preview-glyph {
    @apply tw-text-black;
  }
}

.code-preview-glyph:hover {
  @apply tw-bg-secondary tw-cursor-pointer tw-text-black;
}
</style>

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
