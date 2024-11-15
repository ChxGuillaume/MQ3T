<script setup lang="ts">
import CodePreview from '@renderer/components/tap-topics/CodePreview.vue'
import { useFavoriteTopicsStore } from '@renderer/store/favorite-topics'
import CopyContextMenu from '@renderer/components/CopyContextMenu.vue'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed } from 'vue'

const favoriteTopicsStore = useFavoriteTopicsStore()
const mqttTopicsStore = useMqttTopicsStore()

const props = defineProps<{
  clientKey: string
  topicKey: string
}>()

const breadcrumbs = computed(() => {
  return props.topicKey.split('/')
})

const lastMessage = computed(() => {
  return mqttTopicsStore.getTopicLastMessage(props.clientKey, props.topicKey)
})
</script>

<template>
  <q-card flat>
    <q-card-section class="tw-p-2 tw-flex tw-items-center tw-justify-between">
      <q-breadcrumbs gutter="none">
        <q-breadcrumbs-el>
          <q-chip
            size="sm"
            text-color="white"
            square
            ripple
            clickable
            class="tw-bg-yellow-500"
            @click="favoriteTopicsStore.removeFavoriteTopic(props.clientKey, props.topicKey)"
          >
            <q-icon name="fa-regular fa-star" color="black" />
          </q-chip>
        </q-breadcrumbs-el>
        <q-breadcrumbs-el v-for="(topicPart, index) in breadcrumbs" :key="index">
          <q-chip
            size="sm"
            color="primary"
            :text-color="topicPart ? 'white' : 'grey-6'"
            square
            ripple
            clickable
            :label="topicPart ? topicPart : '<\empty>'"
          >
            <copy-context-menu anchor="bottom left" self="top left" />
          </q-chip>
        </q-breadcrumbs-el>
      </q-breadcrumbs>
    </q-card-section>

    <q-card-section class="tw-h-32 tw-w-full tw-p-0">
      <code-preview
        v-if="lastMessage"
        :value="lastMessage.message"
        :language="lastMessage.dataType"
        :topic-key="props.topicKey"
        :connection-key="props.clientKey"
      />
      <q-chip v-else class="tw-mr-2" color="grey-5" text-color="grey-10"> No messages </q-chip>
    </q-card-section>
  </q-card>
  <q-separator />
</template>

<style scoped lang="less"></style>
