<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMqttTopicsStore } from '../../store/mqtt-topics'
import { formatCode } from '../../assets/js/format-code'
import LineChartCard from '../graphs/LineChartCard.vue'
import * as monaco from 'monaco-editor'
import { useQuasar } from 'quasar'
import _ from 'lodash'

const mqttTopicsStore = useMqttTopicsStore()

const $q = useQuasar()

const props = defineProps<{
  connectionKey?: string
  topicKey?: string
  value: string
  modifiedValue: string
  language?: 'raw' | 'json' | 'xml' | 'yaml' | string
  hideTopBorder?: boolean
  hideGlyphs?: boolean
}>()

let codeEditor: monaco.editor.IStandaloneDiffEditor | null = null

const monacoEditorRef = ref(null)

const currentDataPath = ref('')
const forceShowGraph = ref(false)
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
    const original = monaco.editor.createModel(formatedValue, props.language || 'raw')

    const modified = monaco.editor.createModel(
      formatCode(props.modifiedValue, props.language || 'raw'),
      props.language || 'raw'
    )

    codeEditor?.setModel({
      original: original,
      modified: modified
    })
  },
  250,
  { leading: true, trailing: true, maxWait: 250 }
)

watch([() => props.value, () => props.modifiedValue], (newValue) => {
  if (!codeEditor) return

  updatePreviewValue(newValue[0])
})

watch(
  () => $q.dark.isActive,
  (isDark) => {
    if (!codeEditor) return

    if (isDark) monaco.editor.setTheme('vs-dark-darker')
    else monaco.editor.setTheme('vs-lighter')
  }
)

onMounted(() => {
  if (!monacoEditorRef.value) return

  codeEditor = monaco.editor.createDiffEditor(monacoEditorRef.value, {
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
    glyphMargin: !props.hideGlyphs
  })

  updatePreviewValue(props.value)
})

onBeforeUnmount(() => {
  if (codeEditor) codeEditor.dispose()
})
</script>

<template>
  <div ref="monacoEditorRef" class="monaco-editor" :class="{ 'tw-border-t': !hideTopBorder }" />
  <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
    <div
      ref="myGraph"
      v-if="!hideGlyphs && language === 'json'"
      v-show="showGraph || forceShowGraph"
      class="tw-fixed tw-w-fit"
      :style="{ left: `${x}px`, top: `${ySafe}px` }"
      @mouseenter="forceShowGraph = true"
      @mouseleave="forceShowGraph = false"
    >
      <line-chart-card
        class="tw-w-[500px]"
        :data-graph="{
          id: null,
          clientKey: props.connectionKey || mqttTopicsStore.selectedConnection,
          topic: props.topicKey || mqttTopicsStore.selectedTopic,
          dataPath: currentDataPath,
          curveType: 'curve'
        }"
      >
        <template #bottom>
          <div class="color-details tw-mt-3 tw-text-center">Click to add widget</div>
        </template>
      </line-chart-card>
    </div>
  </transition>
</template>

<style lang="less">
.code-preview-glyph {
  @apply tw-rounded-full tw-transition-colors;
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
  @apply tw-cursor-pointer tw-bg-secondary tw-text-black;
}
</style>

<style scoped lang="less">
.monaco-editor {
  @apply tw-w-full tw-outline-0;
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
