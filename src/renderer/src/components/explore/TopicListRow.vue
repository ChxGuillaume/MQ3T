<script setup lang="ts">
import { formatAge, formatCount, parseMessage } from '@renderer/assets/js/payload-insight'
import { highlightSegments, topicListGridClass } from './topic-tree-context'
import { useTopicActions } from '@renderer/composables/useTopicActions'
import { useSharedNow } from '@renderer/composables/useSharedNow'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useAppStore } from '@renderer/store/app-store'
import { computed, useTemplateRef, watch } from 'vue'
import { useElementVisibility } from '@vueuse/core'
import TopicValueText from './TopicValueText.vue'
import TopicTypeTile from './TopicTypeTile.vue'
import ActivityLayer from './ActivityLayer.vue'

const props = defineProps<{ clientKey: string; topic: string; keywords: string[] }>()

const emit = defineEmits<{ select: [topic: string] }>()

const mqttTopicsStore = useMqttTopicsStore()
const appStore = useAppStore()
const now = useSharedNow()

const rowRef = useTemplateRef('rowRef')
const activityRef = useTemplateRef('activityRef')
const visible = useElementVisibility(rowRef, { rootMargin: '200px' })

const { hasActions, favoritedTopics, isSelectedTopic, topicLastMessage, menuItems } =
  useTopicActions({ clientKey: () => props.clientKey, topic: () => props.topic })

const kind = computed(() =>
  topicLastMessage.value ? parseMessage(topicLastMessage.value).kind : 'empty'
)

const prefix = computed(() => {
  const index = props.topic.lastIndexOf('/')

  return index === -1 ? '' : props.topic.slice(0, index + 1)
})

const leaf = computed(() => props.topic.slice(prefix.value.length))

const prefixSegments = computed(() => highlightSegments(prefix.value, props.keywords))
const leafSegments = computed(() => highlightSegments(leaf.value, props.keywords))

const messagesCount = computed(() =>
  formatCount(mqttTopicsStore.getSubTopicsMessagesCount(props.clientKey, props.topic))
)

const age = computed(() => {
  if (!topicLastMessage.value) return ''

  return formatAge(now.value.getTime() - topicLastMessage.value.createdAt.getTime())
})

watch(topicLastMessage, () => visible.value && activityRef.value?.animate())
</script>

<template>
  <UContextMenu :items="menuItems">
    <div
      ref="rowRef"
      role="option"
      :aria-selected="isSelectedTopic"
      :data-topic-path="topic"
      class="border-default relative h-10 w-full shrink-0 cursor-pointer items-center overflow-hidden border-b px-2 text-[13px] select-none"
      :class="[
        topicListGridClass,
        isSelectedTopic
          ? 'bg-primary/10 shadow-[inset_3px_0_0_var(--ui-primary)]'
          : 'hover:bg-elevated',
        { 'transition-colors': !appStore.isScrubbingTopics }
      ]"
      @click="emit('select', topic)"
    >
      <TopicTypeTile :kind="kind" size="sm" />
      <span class="flex min-w-0 items-center gap-1.5 font-mono" :title="topic">
        <span class="truncate whitespace-nowrap">
          <span class="text-muted">
            <template v-for="(segment, index) in prefixSegments" :key="index">
              <mark v-if="segment.hit" class="topic-hit">{{ segment.text }}</mark>
              <template v-else>{{ segment.text }}</template>
            </template>
          </span>
          <span
            class="font-bold"
            :class="[isSelectedTopic ? 'text-primary' : '', { 'text-dimmed italic': !leaf }]"
          >
            <template v-if="!leaf">(empty)</template>
            <template v-for="(segment, index) in leafSegments" :key="index">
              <mark v-if="segment.hit" class="topic-hit">{{ segment.text }}</mark>
              <template v-else>{{ segment.text }}</template>
            </template>
          </span>
        </span>
        <UIcon v-if="favoritedTopics" name="i-lucide-star" class="text-primary size-3 shrink-0" />
        <UIcon v-if="hasActions" name="i-lucide-play" class="text-accent size-3 shrink-0" />
      </span>
      <span class="flex min-w-0">
        <TopicValueText v-if="visible" :message="topicLastMessage" />
      </span>
      <span class="text-muted text-right text-xs">{{ messagesCount }}</span>
      <span
        class="text-right text-xs"
        :class="age === 'now' ? 'text-primary font-bold' : 'text-muted'"
      >
        {{ age }}
      </span>
      <ActivityLayer
        ref="activityRef"
        :tone="hasActions ? 'action' : isSelectedTopic ? 'active' : 'default'"
      />
    </div>
  </UContextMenu>
</template>

<style scoped>
.topic-hit {
  border-radius: 3px;
  padding: 0 1px;
  background: color-mix(in oklab, var(--ui-primary) 15%, transparent);
  color: var(--ui-primary);
}
</style>
