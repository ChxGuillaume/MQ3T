<script setup lang="ts">
import StableLabel from '@renderer/components/ui/StableLabel.vue'
import { InspectorTab, useExploreUiStore } from '@renderer/store/explore-ui'
import { computed } from 'vue'

const props = defineProps<{ clientKey: string; topic: string }>()

defineSlots<{ default?: () => unknown }>()

const exploreUiStore = useExploreUiStore()

const tabs = [
  { label: 'Value', value: 'value' },
  { label: 'History', value: 'history' },
  { label: 'Graph', value: 'graph' },
  { label: 'Publish', value: 'publish' }
]

const title = computed(() => props.topic.split('/').pop() || '(empty)')

const tab = computed<InspectorTab>({
  get: (): InspectorTab => 'history',
  set: (value) => {
    exploreUiStore.setTopicTab(props.clientKey, props.topic, value)
    exploreUiStore.layout = 'split'
  }
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3">
    <h1 class="font-mono text-[22px] font-bold break-all">{{ title }}</h1>
    <UTabs
      v-model="tab"
      :items="tabs"
      :content="false"
      variant="link"
      size="sm"
      :ui="{
        list: 'gap-[18px] border-b-0',
        trigger: 'px-0 font-medium data-[state=active]:font-bold'
      }"
    >
      <template #default="{ item }">
        <StableLabel :text="item.label" />
      </template>
    </UTabs>
    <slot />
  </div>
</template>
