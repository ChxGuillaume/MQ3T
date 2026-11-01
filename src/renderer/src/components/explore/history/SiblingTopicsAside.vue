<script setup lang="ts">
import { sortTopicKeys } from '../topic-tree-context'
import { formatCount } from '@renderer/assets/js/payload-insight'
import { useExploreUiStore } from '@renderer/store/explore-ui'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed } from 'vue'

const props = defineProps<{ clientKey: string; topic: string }>()

const emit = defineEmits<{ select: [topic: string] }>()

const mqttTopicsStore = useMqttTopicsStore()
const exploreUiStore = useExploreUiStore()

const parentParts = computed(() => props.topic.split('/').slice(0, -1))

const siblings = computed(() => {
  let node = mqttTopicsStore.getConnectionTopicsStructure(props.clientKey)

  for (const part of parentParts.value) node = node?.[part] ?? {}

  const prefix = parentParts.value.length ? `${parentParts.value.join('/')}/` : ''

  return Object.keys(node || {})
    .sort(sortTopicKeys)
    .map((key) => ({
      key,
      path: `${prefix}${key}`,
      count: formatCount(
        mqttTopicsStore.getSubTopicsMessagesCount(props.clientKey, `${prefix}${key}`)
      )
    }))
})
</script>

<template>
  <aside
    aria-label="Topic tree, collapsed"
    class="border-default flex max-w-[320px] min-w-0 flex-[1_1_260px] flex-col gap-1 overflow-auto border-r p-3"
  >
    <UButton
      icon="i-lucide-arrow-left"
      label="All topics"
      color="neutral"
      variant="outline"
      class="text-muted mb-2 justify-start"
      @click="exploreUiStore.layout = 'split'"
    />
    <div v-if="parentParts.length" class="text-muted truncate px-2.5 pb-1.5 font-mono text-xs">
      {{ parentParts.join(' / ') }} /
    </div>
    <button
      v-for="sibling in siblings"
      :key="sibling.path"
      type="button"
      class="flex h-9 shrink-0 items-center gap-2 rounded-md px-2.5 text-left text-[13px]"
      :class="sibling.path === topic ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted'"
      @click="emit('select', sibling.path)"
    >
      <span class="truncate font-mono">{{ sibling.key || '(empty)' }}</span>
      <span class="text-muted ml-auto text-xs font-normal">{{ sibling.count }}</span>
    </button>
  </aside>
</template>
