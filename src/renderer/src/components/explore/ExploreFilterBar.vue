<script setup lang="ts">
import { TopicDisplayMode, useExploreUiStore } from '@renderer/store/explore-ui'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import type { DropdownMenuItem } from '@nuxt/ui'
import SmartSearchInput from './SmartSearchInput.vue'
import { computed } from 'vue'

defineProps<{ countLabel: { text: string; title: string } }>()

const emit = defineEmits<{ collapseAll: []; revealSelected: [] }>()

const mqttTopicsStore = useMqttTopicsStore()
const exploreUiStore = useExploreUiStore()

const search = computed({
  get: () => mqttTopicsStore.topicSearch,
  set: (value: string) => mqttTopicsStore.setTopicSearch(value)
})

type ViewMode = TopicDisplayMode | 'favorites'

const viewModes: { label: string; value: ViewMode; icon: string }[] = [
  { label: 'Tree', value: 'tree', icon: 'i-lucide-list-tree' },
  { label: 'List', value: 'line', icon: 'i-lucide-list' },
  { label: 'Favorites', value: 'favorites', icon: 'i-lucide-star' }
]

const viewMode = computed<ViewMode>(() =>
  exploreUiStore.filterFavorites ? 'favorites' : exploreUiStore.displayMode
)

const setViewMode = (mode: ViewMode) => {
  exploreUiStore.filterFavorites = mode === 'favorites'

  if (mode !== 'favorites') exploreUiStore.displayMode = mode
}

const filters = computed(() => [
  {
    label: 'Changing now',
    icon: 'i-lucide-activity',
    query: 'is:changing',
    pressed: exploreUiStore.filterChanging,
    toggle: () => (exploreUiStore.filterChanging = !exploreUiStore.filterChanging)
  },
  {
    label: 'Retained',
    icon: 'i-lucide-pin',
    query: 'is:retained',
    pressed: exploreUiStore.filterRetained,
    toggle: () => (exploreUiStore.filterRetained = !exploreUiStore.filterRetained)
  }
])

const activeFilterCount = computed(() => filters.value.filter((filter) => filter.pressed).length)

const filterMenuItems = computed<DropdownMenuItem[][]>(() => [
  [{ type: 'label', label: 'Show only' }],
  filters.value.map((filter) => ({
    type: 'checkbox',
    label: filter.label,
    icon: filter.icon,
    kbds: [filter.query],
    checked: filter.pressed,
    onUpdateChecked: filter.toggle,
    onSelect: (event: Event) => event.preventDefault()
  }))
])
</script>

<template>
  <div class="@container">
    <div class="flex items-center gap-2 px-4 py-2">
      <SmartSearchInput
        v-model="search"
        :client-key="mqttTopicsStore.selectedConnection"
        :placeholder="
          exploreUiStore.filterFavorites
            ? 'Filter favorites, try is:changing or temp>20'
            : 'Search topics and values, try temp>20 is:retained'
        "
        :count="countLabel"
        class="min-w-0 flex-1"
      />

      <div class="bg-muted flex shrink-0 gap-0.5 rounded-md p-0.5">
        <UTooltip v-for="mode in viewModes" :key="mode.value" :text="mode.label">
          <UButton
            :icon="mode.icon"
            size="xs"
            color="neutral"
            variant="ghost"
            :aria-label="`${mode.label} view`"
            :aria-pressed="viewMode === mode.value"
            :class="
              viewMode === mode.value
                ? 'bg-default text-primary hover:bg-default rounded-sm'
                : 'text-muted rounded-sm'
            "
            @click="setViewMode(mode.value)"
          />
        </UTooltip>
      </div>

      <UDropdownMenu :items="filterMenuItems" :content="{ align: 'end' }">
        <UTooltip text="Filters">
          <UButton
            icon="i-lucide-list-filter"
            size="sm"
            color="neutral"
            :variant="activeFilterCount ? 'soft' : 'ghost'"
            aria-label="Filters"
            class="relative shrink-0"
            :class="activeFilterCount ? 'text-primary' : ''"
          >
            <span
              v-if="activeFilterCount"
              class="bg-primary text-inverted absolute -top-1 -right-1 min-w-4 rounded-full px-1 text-[10px] leading-4 font-bold"
            >
              {{ activeFilterCount }}
            </span>
          </UButton>
        </UTooltip>
      </UDropdownMenu>

      <div class="flex shrink-0 items-center">
        <UTooltip text="Collapse all">
          <UButton
            icon="i-lucide-chevrons-down-up"
            size="sm"
            color="neutral"
            variant="ghost"
            aria-label="Collapse all"
            :disabled="viewMode !== 'tree'"
            @click="emit('collapseAll')"
          />
        </UTooltip>
        <UTooltip text="Reveal selected">
          <UButton
            icon="i-lucide-locate-fixed"
            size="sm"
            color="neutral"
            variant="ghost"
            aria-label="Reveal selected"
            :disabled="viewMode !== 'tree' || !mqttTopicsStore.selectedTopic"
            @click="emit('revealSelected')"
          />
        </UTooltip>
      </div>
    </div>
  </div>
</template>
