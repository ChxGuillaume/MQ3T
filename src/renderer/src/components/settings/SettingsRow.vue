<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="border-default flex flex-wrap items-center gap-4 border-t px-5 py-4 first:border-t-0">
    <div class="min-w-0 flex-[1_1_280px]">
      <b class="block text-sm font-semibold">{{ title }}</b>
      <span v-if="description || $slots.description" class="text-muted mt-0.5 block text-[13px]">
        <slot name="description">{{ description }}</slot>
      </span>
    </div>
    <slot />
  </div>
</template>
