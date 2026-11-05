<script setup lang="ts">
import { TopicDisplayMode, useExploreUiStore } from '@renderer/store/explore-ui'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import type { DropdownMenuItem } from '@nuxt/ui'
import { computed } from 'vue'

defineProps<{ countLabel: string }>()

const emit = defineEmits<{ collapseAll: []; revealSelected: [] }>()

const mqttTopicsStore = useMqttTopicsStore()
const exploreUiStore = useExploreUiStore()

const search = computed({
  get: () => mqttTopicsStore.topicSearch,
  set: (value: string) => mqttTopicsStore.setTopicSearch(value)
})

const displayModes: { label: string; value: TopicDisplayMode; icon: string }[] = [
  { label: 'Tree', value: 'tree', icon: 'i-lucide-list-tree' },
  { label: 'List', value: 'line', icon: 'i-lucide-list' }
]

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

const activeChipCount = computed(() => chips.value.filter((chip) => chip.pressed).length)

const filterMenuItems = computed<DropdownMenuItem[]>(() =>
  chips.value.map((chip) => ({
    type: 'checkbox',
    label: chip.label,
    checked: chip.pressed,
    onUpdateChecked: chip.toggle,
    onSelect: (event: Event) => event.preventDefault()
  }))
)
</script>

<template>
  <div class="@container">
    <div class="flex items-center gap-2 px-4 py-2">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        :placeholder="
          exploreUiStore.filterFavorites
            ? 'Filter favorites'
            : 'Filter topics, wildcards work: line-2/+/temperature'
        "
        class="min-w-0 flex-1"
        :ui="{ base: 'h-8' }"
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

      <div
        v-if="!exploreUiStore.filterFavorites"
        class="bg-muted flex shrink-0 gap-0.5 rounded-md p-0.5"
      >
        <UTooltip v-for="mode in displayModes" :key="mode.value" :text="mode.label">
          <UButton
            :icon="mode.icon"
            size="xs"
            color="neutral"
            variant="ghost"
            :aria-label="`${mode.label} display`"
            :aria-pressed="exploreUiStore.displayMode === mode.value"
            :class="
              exploreUiStore.displayMode === mode.value
                ? 'bg-default text-primary hover:bg-default rounded-sm'
                : 'text-muted rounded-sm'
            "
            @click="exploreUiStore.displayMode = mode.value"
          />
        </UTooltip>
      </div>

      <div class="hidden shrink-0 items-center gap-1.5 @3xl:flex">
        <UButton
          v-for="chip in chips"
          :key="chip.label"
          :label="chip.label"
          :aria-pressed="chip.pressed"
          color="neutral"
          variant="outline"
          class="h-8 px-3 text-xs whitespace-nowrap"
          :class="
            chip.pressed
              ? 'bg-primary/10 text-primary ring-primary hover:bg-primary/10 font-bold'
              : 'font-medium'
          "
          @click="chip.toggle"
        />
      </div>

      <UDropdownMenu :items="filterMenuItems" :content="{ align: 'end' }">
        <UButton
          icon="i-lucide-list-filter"
          color="neutral"
          variant="outline"
          aria-label="Filters"
          class="h-8 shrink-0 px-2 text-xs font-medium @3xl:hidden"
          :class="
            activeChipCount ? 'bg-primary/10 text-primary ring-primary hover:bg-primary/10' : ''
          "
        >
          <span class="hidden @md:inline">Filters</span>
          <span
            v-if="activeChipCount"
            class="bg-primary text-inverted rounded-full px-1.5 text-[10px] leading-4 font-bold"
          >
            {{ activeChipCount }}
          </span>
        </UButton>
      </UDropdownMenu>

      <template v-if="!exploreUiStore.filterFavorites && exploreUiStore.displayMode === 'tree'">
        <UTooltip text="Collapse all">
          <UButton
            icon="i-lucide-chevrons-down-up"
            size="sm"
            color="neutral"
            variant="ghost"
            aria-label="Collapse all"
            class="shrink-0"
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
            class="shrink-0"
            :disabled="!mqttTopicsStore.selectedTopic"
            @click="emit('revealSelected')"
          />
        </UTooltip>
      </template>

      <span class="text-muted hidden shrink-0 text-xs whitespace-nowrap @xl:inline">
        {{ countLabel }}
      </span>
    </div>
  </div>
</template>
