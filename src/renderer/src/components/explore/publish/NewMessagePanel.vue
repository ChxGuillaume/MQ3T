<script setup lang="ts">
import PublishHistoryList, { SentMessage } from './PublishHistoryList.vue'
import { useExploreUiStore } from '@renderer/store/explore-ui'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useToast } from '@nuxt/ui/composables'
import { computed, useTemplateRef } from 'vue'
import PublishForm from './PublishForm.vue'

const props = defineProps<{ clientKey: string }>()

const mqttTopicsStore = useMqttTopicsStore()
const exploreUiStore = useExploreUiStore()
const toast = useToast()

const formRef = useTemplateRef('formRef')

const topic = computed({
  get: () => exploreUiStore.newMessageTopic,
  set: (value: string) => (exploreUiStore.newMessageTopic = value)
})

const sent = computed<SentMessage[]>(() =>
  Object.entries(mqttTopicsStore.topicsPublishMessages[props.clientKey] ?? {})
    .flatMap(([topic, messages]) => messages.map((message) => ({ topic, message })))
    .sort((a, b) => b.message.createdAt.getTime() - a.message.createdAt.getTime())
    .slice(0, 20)
)

const handlePublished = (publishedTopic: string) => {
  toast.add({
    title: 'Message sent',
    description: publishedTopic,
    icon: 'i-lucide-send',
    color: 'success'
  })
}

const loadSent = (item: SentMessage) => formRef.value?.load(item.message, item.topic)
</script>

<template>
  <aside aria-label="New message" class="bg-default flex h-full min-h-0 flex-col">
    <header class="border-default flex items-center gap-2 border-b px-[18px] py-3.5">
      <h2 class="text-base font-bold">New message</h2>
      <UKbd value="meta" size="sm" /><UKbd value="N" size="sm" class="-ml-1" />
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        aria-label="Close panel"
        class="text-muted ml-auto"
        @click="exploreUiStore.closeNewMessage()"
      />
    </header>
    <div class="flex min-h-0 flex-1 flex-col gap-3.5 overflow-auto px-[18px] pt-4">
      <PublishForm
        ref="formRef"
        v-model:topic="topic"
        :client-key="clientKey"
        mode="new"
        @published="handlePublished"
      />
      <PublishHistoryList
        :items="sent"
        show-topic
        class="pb-4"
        @load="loadSent"
        @convert="formRef?.openConvert($event.message, $event.topic)"
      />
    </div>
  </aside>
</template>
