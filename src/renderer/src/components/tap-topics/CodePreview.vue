<script setup lang="ts">
import { formatCode } from '../../assets/js/format-code'
import TestChartCard from '../graphs/TestChartCard.vue'
import { onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { useQuasar } from 'quasar'
import _ from 'lodash'
import {
  parseJsonForGlyphs,
  getDataFromPath,
  GlyphLine
} from '../../assets/js/parse-json-for-glyphs'

const $q = useQuasar()

const props = defineProps<{
  value: string
  language?: 'raw' | 'json' | 'xml' | 'yaml' | string
  hideTopBorder?: boolean
}>()

const glyphMarginClass = 'code-preview-glyph'
let codeEditor: monaco.editor.IStandaloneCodeEditor | null = null

const monacoEditorRef = ref(null)

const updatePreviewValue = _.debounce(
  (value) => {
    const formatedValue = formatCode(value, props.language || 'raw')
    codeEditor?.setValue(formatedValue)

    if (props.language === 'json') addGlyphs(parseJsonForGlyphs(formatedValue))
  },
  250,
  { leading: true, trailing: true, maxWait: 250 }
)

const encodePathToClass = (path: string): string =>
  path.replace(/\./g, '_-_').replace(/\[/g, '_--_').replace(/]/g, '_---_')
const decodePathFromClass = (path: string): string =>
  path.replace(/---_/g, ']').replace(/--/g, '[').replace(/-/g, '.').replace(/_/g, '')

const addGlyphs = (positions: GlyphLine[]) => {
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

  if (props.language === 'json') addGlyphs(parseJsonForGlyphs(formatedValue))

  codeEditor.onMouseDown((e) => {
    const element = e.target.element

    if (!element) return
    if (!checkForGlyphElement(element)) return

    const dataPathClass =
      element.className
        .split(' ')
        .find((t) => t.startsWith('data-path---'))
        ?.replace('data-path---', '') || ''
    const dataPath = decodePathFromClass(dataPathClass)

    console.log(dataPath)
    console.log(getDataFromPath(JSON.parse(props.value), dataPath))
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

    x.value = rect.x - graphRect.width
    y.value = rect.y + rect.height / 2 - graphRect.height / 2
  })
})

const checkForGlyphElement = (element: HTMLElement | null): boolean => {
  if (!element) return false

  return element.classList.contains(glyphMarginClass)
}

const x = ref(0)
const y = ref(0)
const forceShowGraph = ref(false)
const showGraph = ref(false)
const myGraph = ref<HTMLDivElement | null>(null)
</script>

<template>
  <div ref="monacoEditorRef" class="monaco-editor" :class="{ 'tw-border-t': !hideTopBorder }" />
  <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
    <div
      ref="myGraph"
      v-show="showGraph || forceShowGraph"
      class="tw-fixed"
      :style="{ top: `${y}px`, left: `${x}px` }"
      @mouseenter="forceShowGraph = true"
      @mouseleave="forceShowGraph = false"
    >
      <test-chart-card />
    </div>
  </transition>
</template>

<!-- TODO: Theming -->
<style lang="less">
.code-preview-glyph {
  @apply tw-transition-colors tw-rounded-full tw-text-white;
  font-size: 10px;
}

.code-preview-glyph:hover {
  @apply tw-bg-accent tw-cursor-pointer tw-text-black;
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
