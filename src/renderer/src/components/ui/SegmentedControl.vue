<script setup lang="ts" generic="T extends string | number">
import StableLabel from './StableLabel.vue'
import { computed } from 'vue'

export type SegmentedItem<V> = { label: string; value: V; icon?: string; disabled?: boolean }

const props = withDefaults(
  defineProps<{
    items: SegmentedItem<T>[]
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' }
)

const model = defineModel<T>({ required: true })

const tabsItems = computed(() =>
  props.items.map((item) => ({ ...item, value: String(item.value) }))
)

const value = computed({
  get: () => String(model.value),
  set: (val: string | number) => {
    const item = props.items.find((i) => String(i.value) === String(val))
    if (item) model.value = item.value
  }
})
</script>

<template>
  <UTabs
    v-model="value"
    :items="tabsItems"
    :content="false"
    color="neutral"
    variant="pill"
    :size="size === 'sm' ? 'xs' : 'sm'"
    :ui="{
      root: 'w-auto',
      list: 'w-auto gap-0.5 rounded-md bg-muted p-[3px]',
      indicator: 'inset-y-[3px] rounded-sm bg-default shadow-none',
      trigger: `grow-0 rounded-sm data-[state=active]:font-bold data-[state=active]:text-primary ${
        size === 'sm' ? 'h-[26px] px-2.5' : 'h-[30px] px-3.5 text-[13px]'
      }`
    }"
  >
    <template #default="{ item }">
      <StableLabel :text="item.label" />
    </template>
  </UTabs>
</template>
