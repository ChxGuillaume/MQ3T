<script setup lang="ts">
import FavoriteTopicCard from '@renderer/components/tap-topics/FavoriteTopicCard.vue'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useFavoriteTopicsStore } from '@renderer/store/favorite-topics'
import { sortTopics } from '@renderer/assets/js/sort-topics'
import { computed } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const favoriteTopicsStore = useFavoriteTopicsStore()

const favoriteTopics = computed(() => {
  const favorites: [string, string[]][] = Array.from(
    favoriteTopicsStore.favoriteTopics.entries()
  ).map(([key, value]) => [key, Array.from(value.keys())])

  favorites.sort(([a], [b]) => {
    const aIndex = mqttConnectionsStore.connections.findIndex((conn) => conn.clientKey === a)
    const bIndex = mqttConnectionsStore.connections.findIndex((conn) => conn.clientKey === b)

    return aIndex - bIndex
  })

  favorites.forEach(([_, topics]) => {
    topics.sort(sortTopics)
  })

  return favorites.filter(([_, topics]) => topics.length > 0)
})
</script>

<template>
  <q-card
    v-if="favoriteTopics.length === 0"
    flat
    class="tw-flex tw-h-full tw-flex-col tw-justify-center tw-gap-4"
  >
    <h1 class="tw-w-full tw-text-center tw-text-2xl tw-font-bold">No favorite topic found</h1>
    <h2 class="tw-w-full tw-px-4 tw-text-center tw-text-sm">
      To add a topic to your favorites, right click on a topic and select "Favorite"
    </h2>
  </q-card>
  <div v-else class="tw-flex tw-h-full tw-w-full tw-flex-col tw-gap-8">
    <div v-for="([clientKey, topics], index) in favoriteTopics" :key="clientKey">
      <q-separator v-if="index" />
      <div class="title-container tw-py-2">
        <h1 class="text-weight-bold tw-text-center tw-text-xl">
          {{ mqttConnectionsStore.getConnection(clientKey)?.name }}
        </h1>
      </div>
      <q-separator />
      <favorite-topic-card
        v-for="topic in topics"
        :key="topic"
        :clientKey="clientKey"
        :topicKey="topic"
      />
    </div>
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
