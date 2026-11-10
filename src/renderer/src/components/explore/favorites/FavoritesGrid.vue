<script setup lang="ts">
import { useFavoriteTopicsStore } from '@renderer/store/favorite-topics'
import { useTopicFilter } from '@renderer/composables/useTopicQuery'
import FavoriteCard from './FavoriteCard.vue'
import draggable from 'vuedraggable'
import { computed } from 'vue'

const props = defineProps<{ clientKey: string }>()

const emit = defineEmits<{ open: [topic: string] }>()

const favoriteTopicsStore = useFavoriteTopicsStore()
const { filterActive, topicStage, factsStage } = useTopicFilter(() => props.clientKey)

const favorites = computed({
  get: () => favoriteTopicsStore.getClientFavoriteTopics(props.clientKey),
  set: (topics: string[]) => favoriteTopicsStore.reorderFavoriteTopics(props.clientKey, topics)
})

const visible = computed(() => factsStage(topicStage(favorites.value)))
</script>

<template>
  <div class="min-h-0 flex-1 overflow-auto px-4 pb-6">
    <UEmpty
      v-if="!favorites.length"
      icon="i-lucide-star"
      title="No favorite topic yet"
      description="Right-click a topic and pick Favorite, or use the star in the inspector."
      variant="naked"
      class="py-16"
    />
    <draggable
      v-else-if="!filterActive"
      v-model="favorites"
      :item-key="(topic: string) => topic"
      handle=".drag-handle-card"
      :animation="150"
      class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3"
    >
      <template #item="{ element }">
        <div class="drag-handle-card">
          <FavoriteCard :client-key="clientKey" :topic="element" @open="emit('open', $event)" />
        </div>
      </template>
    </draggable>
    <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3">
      <FavoriteCard
        v-for="topic in visible"
        :key="topic"
        :client-key="clientKey"
        :topic="topic"
        @open="emit('open', $event)"
      />
      <p v-if="!visible.length" class="text-muted col-span-full py-10 text-center text-sm">
        No favorite matches this filter
      </p>
    </div>
  </div>
</template>
