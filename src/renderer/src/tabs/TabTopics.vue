<script setup lang="ts">
import TopicItem from '../components/tap-topics/TopicItem.vue'
import { useSettingsStore } from '../store/settings-store'
import { useMqttTopicsStore } from '../store/mqtt-topics'
import { onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const splitterModel = ref(400)

const showTopics = ref(false)

const tab = ref('values')
const current = ref(1)

const handleTopicClick = (key: string) => {
  console.log('handleTopicClick', key)
  mqttTopicsStore.setSelectedTopic(key)
  codeEditor?.setValue('')
}

const copySelectedTopic = () => {
  navigator.clipboard.writeText(mqttTopicsStore.selectedTopic)
}

const updateEditor = (message) => {
  if (!message) return

  let data = message

  try {
    data = JSON.parse(message)
    data = JSON.stringify(data, null, 2)
  } catch (e) {
    console.log(e)
  }

  codeEditor?.setValue(data)
}

watch(
  () => mqttTopicsStore.getSelectedTopicLastMessage,
  (mqttMessage) => {
    updateEditor(mqttMessage?.message)
  }
)

const monacoEditor = ref(null)
let codeEditor: monaco.editor.IStandaloneCodeEditor | null = null
onMounted(() => {
  setTimeout(() => {
    showTopics.value = true
  }, 100)

  if (!monacoEditor.value) return

  monaco.editor.defineTheme('vs-lighter', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#f5f5f5'
    }
  })
  monaco.editor.defineTheme('vs-dark-darker', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#262626'
    }
  })

  codeEditor = monaco.editor.create(monacoEditor.value, {
    value: '{}',
    language: 'json',
    theme: $q.dark.isActive ? 'vs-dark-darker' : 'vs-lighter',
    overviewRulerLanes: 0,
    fontSize: 11,
    readOnly: true,
    lineNumbers: 'off',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true
  })
})

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
</script>

<template>
  <q-splitter
    v-model="splitterModel"
    class="tw-h-full tw-max-h-full"
    :limits="[400, 700]"
    unit="px"
    reverse
  >
    <template v-slot:before>
      <TopicItem
        v-if="showTopics"
        v-for="[key, value] in Object.entries(mqttTopicsStore.topicsStructure)"
        :key="key"
        :topic-key="key"
        :topic-path="key"
        :topic-structure="value"
        @topic:click="handleTopicClick"
      />
    </template>

    <template v-slot:after>
      <q-card class="tw-h-full tw-grid" style="grid-template-rows: auto auto 1fr auto">
        <div class="tw-p-4 tw-flex tw-flex-col tw-gap-4">
          <div class="tw-flex tw-gap-2">
            <h2 class="tw-text-xl tw-font-bold">Topic</h2>
            <q-btn
              size="sm"
              color="secondary"
              flat
              round
              icon="fa-solid fa-copy"
              @click="copySelectedTopic"
            />
          </div>

          <q-breadcrumbs gutter="none">
            <q-breadcrumbs-el v-for="topicPart in mqttTopicsStore.selectedTopic.split('/')">
              <q-chip
                size="sm"
                color="primary"
                text-color="white"
                square
                ripple
                clickable
                :label="topicPart"
              />
            </q-breadcrumbs-el>
          </q-breadcrumbs>
        </div>

        <q-separator />

        <q-tab-panels v-model="tab" animated keep-alive>
          <q-tab-panel name="values">
            <div id="test">
              <div ref="monacoEditor" class="monaco-editor" />
            </div>
            <div class="tw-flex tw-justify-center">
              <q-pagination
                v-model="current"
                class="tw-mx-auto"
                size="sm"
                :max="Math.ceil(mqttTopicsStore.getSelectedTopicMessages.length / 5)"
                input
              />
            </div>
            <!--            <div v-for="message in mqttTopicsStore.getSelectedTopicMessages.slice(0, 2)">-->
            <!--              {{ settingsStore.formatDateTime(message.createdAt) }}-->
            <!--              {{ message.message }}-->
            <!--            </div>-->
          </q-tab-panel>

          <q-tab-panel name="publish">
            <div class="text-h6">Alarms</div>
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
          </q-tab-panel>

          <q-tab-panel name="stats">
            <div class="text-h6">Movies</div>
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
          </q-tab-panel>
        </q-tab-panels>

        <q-separator />

        <q-tabs
          v-model="tab"
          inline-label
          align="justify"
          active-bg-color="primary"
          indicator-color="transparent"
          active-color="white"
        >
          <q-tab name="values">
            <q-icon name="fa-solid fa-list-ol" class="tw-mr-2" />
            Values
          </q-tab>
          <q-tab name="publish">
            <q-icon name="fa-solid fa-paper-plane" class="tw-mr-2" />
            Publish
          </q-tab>
          <q-tab name="stats">
            <q-icon name="fa-solid fa-chart-simple" class="tw-mr-2" />
            Stats
          </q-tab>
        </q-tabs>
      </q-card>
    </template>
  </q-splitter>
</template>

<style scoped lang="less">
.monaco-editor {
  @apply tw-w-full tw-border tw-rounded-xl tw-overflow-hidden;
  min-height: 200px;
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
