<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    isValid: boolean
    language?: 'raw' | 'json' | 'xml' | 'yaml' | string
    size?: 'xs' | 'sm'
  }>(),
  { size: 'sm' }
)

const iconSize = computed(() => {
  switch (props.size) {
    case 'xs':
      return '12px'
    case 'sm':
      return '16px'
    default:
      return '12px'
  }
})
</script>

<template>
  <div
    class="badge"
    :class="[{ 'tw-bg-green-500': isValid, 'tw-bg-red-500': !isValid }, `size-${size}`]"
  >
    <q-icon
      :name="isValid ? 'fa-solid fa-check' : 'fa-solid fa-xmark'"
      :class="{ 'tw-text-green-100': isValid, 'tw-text-red-100': !isValid }"
      :size="iconSize"
    >
    </q-icon>
    <q-tooltip
      class="tw-text-sm"
      :class="{ 'tw-bg-green-500': isValid, 'tw-bg-red-500': !isValid }"
    >
      {{ isValid ? 'Valid Format' : 'Invalid Format' }}
    </q-tooltip>
  </div>
</template>

<style scoped lang="less">
.badge {
  @apply tw-flex tw-justify-center tw-items-center tw-rounded-full;
}

.badge.valid {
  @apply tw-bg-green-500;
}

.badge.invalid {
  @apply tw-bg-red-500;
}

.badge.size-xs {
  @apply tw-w-6 tw-h-6;
}

.badge.size-sm {
  @apply tw-w-8 tw-h-8;
}
</style>
