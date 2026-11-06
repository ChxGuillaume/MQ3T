<script setup lang="ts">
import { ChainRunRecord, useChainRunHistoryStore } from '@renderer/store/chain-run-history'
import { formatChainDuration } from '../action-utils'
import ChainRunLog from './ChainRunLog.vue'
import { computed, ref } from 'vue'

const props = defineProps<{ chainId: string }>()

const historyStore = useChainRunHistoryStore()

const expandedId = ref<string>()

const runs = computed(() => historyStore.getChainRuns(props.chainId))

const OUTCOMES: Record<ChainRunRecord['outcome'], { label: string; class: string }> = {
  done: { label: 'Finished', class: 'bg-success' },
  stopped: { label: 'Stopped', class: 'bg-warning' },
  failed: { label: 'Failed', class: 'bg-error' }
}

const formatStartedAt = (time: number) =>
  new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

const details = (run: ChainRunRecord) =>
  [
    formatChainDuration(run.endedAt - run.startedAt),
    run.iterations > 1 ? `${run.iterations} runs` : ''
  ]
    .filter(Boolean)
    .join(' · ')

const toggle = (id: string) => (expandedId.value = expandedId.value === id ? undefined : id)
</script>

<template>
  <div class="flex flex-col gap-1">
    <p v-if="!runs.length" class="text-muted text-sm">No runs yet in this session.</p>

    <div v-for="run in runs" :key="run.id" class="flex flex-col">
      <button
        type="button"
        class="hover:bg-muted flex items-center gap-2.5 rounded-md px-1.5 py-2 text-left text-[13px]"
        :aria-expanded="expandedId === run.id"
        @click="toggle(run.id)"
      >
        <span class="size-2.5 shrink-0 rounded-full" :class="OUTCOMES[run.outcome].class" />
        <span class="min-w-0 flex-1 truncate font-semibold">
          {{ OUTCOMES[run.outcome].label }}
          <span class="text-muted font-normal">· {{ details(run) }}</span>
        </span>
        <span class="text-muted text-xs">{{ formatStartedAt(run.startedAt) }}</span>
        <UIcon
          name="i-lucide-chevron-down"
          class="text-muted size-3.5 shrink-0 transition-transform"
          :class="{ 'rotate-180': expandedId === run.id }"
        />
      </button>
      <ChainRunLog v-if="expandedId === run.id" :entries="run.log" class="mb-2 ml-3" />
    </div>

    <UButton
      v-if="runs.length"
      size="xs"
      color="neutral"
      variant="ghost"
      icon="i-lucide-trash-2"
      label="Clear history"
      class="self-start"
      @click="historyStore.clearChainRuns(chainId)"
    />
  </div>
</template>
