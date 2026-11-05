<script setup lang="ts">
import { formatAge } from '@renderer/assets/js/payload-insight'
import type { MqttMessage } from '@renderer/store/mqtt-topics'
import { useSharedNow } from '@renderer/composables/useSharedNow'
import { computed, ref } from 'vue'

export type SentMessage = { topic: string; message: MqttMessage }

const COLLAPSED_COUNT = 5

const props = withDefaults(
  defineProps<{ items: SentMessage[]; showTopic?: boolean; canConvert?: boolean }>(),
  { canConvert: true }
)

const emit = defineEmits<{
  load: [item: SentMessage]
  convert: [item: SentMessage]
}>()

const now = useSharedNow()

const expanded = ref(false)

const shown = computed(() => (expanded.value ? props.items : props.items.slice(0, COLLAPSED_COUNT)))

const label = (item: SentMessage) => {
  const payload = item.message.message.replace(/\s+/g, ' ') || '(empty)'

  return props.showTopic ? `${item.topic} · ${payload}` : payload
}
</script>

<template>
  <section v-if="items.length" class="flex flex-col gap-1">
    <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">Recently sent</h2>
    <div
      v-for="item in shown"
      :key="item.message.uid"
      class="group hover:bg-muted -mx-2 flex h-[30px] items-center gap-2 rounded-md px-2 text-xs"
    >
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2 text-left"
        :title="`Load into the form: ${item.message.message}`"
        @click="emit('load', item)"
      >
        <span class="min-w-0 flex-1 truncate font-mono">{{ label(item) }}</span>
        <span v-if="item.message.retained" class="text-muted shrink-0">retained</span>
        <span class="text-muted shrink-0">
          {{ formatAge(now.getTime() - item.message.createdAt.getTime()) }}
        </span>
      </button>
      <UTooltip v-if="canConvert" text="Save as action">
        <UButton
          icon="i-lucide-bookmark-plus"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="Save as action"
          class="text-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          @click="emit('convert', item)"
        />
      </UTooltip>
    </div>
    <UButton
      v-if="items.length > COLLAPSED_COUNT"
      :label="expanded ? 'Show less' : `Show all ${items.length}`"
      size="xs"
      color="neutral"
      variant="link"
      class="text-muted self-start px-0"
      @click="expanded = !expanded"
    />
  </section>
</template>
