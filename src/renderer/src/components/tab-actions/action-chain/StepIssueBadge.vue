<script setup lang="ts">
defineProps<{ issues: string[] }>()
</script>

<template>
  <UTooltip v-if="issues.length" :content="{ side: 'top' }">
    <span
      class="bg-warning text-inverted absolute -top-2 -left-2 z-10 flex size-5 items-center justify-center rounded-full shadow-sm"
      :aria-label="`${issues.length} thing${issues.length === 1 ? '' : 's'} to fix`"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-3" />
    </span>
    <template #content>
      <ul class="flex max-w-64 flex-col gap-0.5 text-xs">
        <li v-for="issue in issues" :key="issue">{{ issue }}</li>
      </ul>
    </template>
  </UTooltip>
</template>
