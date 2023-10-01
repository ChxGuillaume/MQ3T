<script setup lang="ts">
import { useMqttTopicsStore } from '../store/mqtt-topics'
import TopicItem from '../components/tap-topics/TopicItem.vue'
import { computed, ref } from 'vue'

const mqttTopicsStore = useMqttTopicsStore()

const splitterModel = ref(70)

const tab = ref('mails')

const handleTopicClick = (key: string) => {
  console.log('handleTopicClick', key)
  mqttTopicsStore.setSelectedTopic(key)
}

const splicedTopic = computed(() => {
  const topicParts = mqttTopicsStore.selectedTopic.split('/')

  return topicParts.slice(1)
})
</script>

<template>
  <q-splitter
    v-model="splitterModel"
    class="tw-h-full tw-max-h-full"
    :limits="[400, Infinity]"
    unit="px"
    reverse
  >
    <template v-slot:before>
      <TopicItem
        v-for="[key, value] in Object.entries(mqttTopicsStore.topicsStructure)"
        :key="key"
        :topic-key="key"
        :topic-path="key"
        :topic-structure="value"
        @topic:click="handleTopicClick"
      />
    </template>

    <template v-slot:after>
      <q-card class="tw-h-full tw-grid" style="grid-template-rows: auto 1fr auto">
        <div class="tw-p-4 tw-flex tw-flex-col tw-gap-4">
          <h2 class="tw-text-xl tw-font-bold">Topic</h2>
          <q-breadcrumbs gutter="sm">
            <q-breadcrumbs-el v-for="topicPart in splicedTopic" :label="topicPart" />
          </q-breadcrumbs>
        </div>
        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="mails">
            <div class="text-h6">Mails</div>
            <div v-for="message in mqttTopicsStore.getSelectedTopicMessages">
              {{ message.message }}
            </div>
          </q-tab-panel>

          <q-tab-panel name="alarms">
            <div class="text-h6">Alarms</div>
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
          </q-tab-panel>

          <q-tab-panel name="movies">
            <div class="text-h6">Movies</div>
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
          </q-tab-panel>
        </q-tab-panels>

        <q-tabs v-model="tab" align="justify" inline-label>
          <q-tab icon="fa-solid fa-list-ol" name="mails" label="Value" />
          <q-tab icon="fa-solid fa-paper-plane" name="alarms" label="Publish" />
          <q-tab icon="fa-solid fa-chart-simple" name="movies" label="Stats" />
        </q-tabs>
      </q-card>
    </template>
  </q-splitter>
</template>

<style scoped lang="less"></style>
