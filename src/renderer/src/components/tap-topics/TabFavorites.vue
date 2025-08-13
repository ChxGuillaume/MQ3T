<script setup lang="ts">
import FavoriteTopicCard from '@renderer/components/tap-topics/FavoriteTopicCard.vue'
import { useFavoriteTopicsStore } from '@renderer/store/favorite-topics'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed } from 'vue'

const favoriteTopicsStore = useFavoriteTopicsStore()
const mqttTopicsStore = useMqttTopicsStore()

const topics = computed(() => {
  return favoriteTopicsStore.getClientFavoriteTopics(mqttTopicsStore.selectedConnection)
})
</script>

<template>
  <q-card
    v-if="!topics.length"
    flat
    class="tw-flex tw-h-full tw-flex-col tw-justify-center tw-gap-4"
  >
    <h1 class="tw-w-full tw-text-center tw-text-2xl tw-font-bold">No favorite topic found</h1>
    <h2 class="tw-w-full tw-px-4 tw-text-center tw-text-sm">
      To add a topic to your favorites, right click on a topic and select "Favorite"
    </h2>
  </q-card>
  <div v-else class="tw-flex tw-h-full tw-w-full tw-flex-col">
    <favorite-topic-card
      v-for="topic in topics"
      :key="topic"
      :client-key="mqttTopicsStore.selectedConnection"
      :topic-key="topic"
    />
  </div>
</template>

<style scoped lang="less">
.body--light {
  .title-container {
    @apply tw-bg-neutral-100;
  }
}

.body--dark {
  .title-container {
    @apply tw-bg-neutral-800;
  }
}
</style>
