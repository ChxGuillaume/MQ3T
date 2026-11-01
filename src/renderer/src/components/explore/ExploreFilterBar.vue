<script setup lang="ts">
import { useExploreUiStore } from '@renderer/store/explore-ui'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed } from 'vue'

defineProps<{ countLabel: string }>()

const mqttTopicsStore = useMqttTopicsStore()
const exploreUiStore = useExploreUiStore()

const search = computed({
  get: () => mqttTopicsStore.topicSearch,
  set: (value: string) => mqttTopicsStore.setTopicSearch(value)
})

const chips = computed(() => [
  {
    label: 'Changing now',
    pressed: exploreUiStore.filterChanging,
    toggle: () => (exploreUiStore.filterChanging = !exploreUiStore.filterChanging)
  },
  {
    label: 'Favorites',
    pressed: exploreUiStore.filterFavorites,
    toggle: () => (exploreUiStore.filterFavorites = !exploreUiStore.filterFavorites)
  },
  {
    label: 'Retained',
    pressed: exploreUiStore.filterRetained,
    toggle: () => (exploreUiStore.filterRetained = !exploreUiStore.filterRetained)
  }
])
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 px-4 py-3">
    <UInput
      v-model="search"
      icon="i-lucide-search"
      :placeholder="
        exploreUiStore.filterFavorites
          ? 'Filter favorites'
          : 'Filter topics, wildcards work: line-2/+/temperature'
      "
      class="min-w-0 flex-[1_1_260px]"
      :ui="{ base: 'h-9' }"
    >
      <template v-if="search" #trailing>
        <UButton
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="link"
          aria-label="Clear filter"
          @click="search = ''"
        />
      </template>
    </UInput>
    <UButton
      v-for="chip in chips"
      :key="chip.label"
      :label="chip.label"
      :aria-pressed="chip.pressed"
      color="neutral"
      variant="outline"
      class="h-8 px-3 text-xs"
      :class="
        chip.pressed
          ? 'bg-primary/10 text-primary ring-primary hover:bg-primary/10 font-bold'
          : 'font-medium'
      "
      @click="chip.toggle"
    />
    <span class="text-muted text-xs">{{ countLabel }}</span>
    <div
      v-if="!exploreUiStore.filterFavorites"
      class="bg-muted ml-auto flex gap-0.5 rounded-md p-0.5"
    >
      <UTooltip text="Tree">
        <UButton
          icon="i-lucide-list-tree"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="Tree display"
          :aria-pressed="exploreUiStore.displayMode === 'tree'"
          :class="exploreUiStore.displayMode === 'tree' ? 'bg-default text-primary rounded-sm' : 'text-muted rounded-sm'"
          @click="exploreUiStore.displayMode = 'tree'"
        />
      </UTooltip>
      <UTooltip text="List">
        <UButton
          icon="i-lucide-list"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="List display"
          :aria-pressed="exploreUiStore.displayMode === 'line'"
          :class="exploreUiStore.displayMode === 'line' ? 'bg-default text-primary rounded-sm' : 'text-muted rounded-sm'"
          @click="exploreUiStore.displayMode = 'line'"
        />
      </UTooltip>
    </div>
  </div>
</template>
