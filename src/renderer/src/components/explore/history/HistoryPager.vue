<script setup lang="ts">
defineProps<{ pages: number }>()

const page = defineModel<number>({ required: true })
</script>

<template>
  <div class="text-muted ml-auto flex shrink-0 items-center gap-1 text-xs">
    <UButton
      icon="i-lucide-chevron-left"
      size="xs"
      color="neutral"
      variant="ghost"
      aria-label="Previous page"
      :disabled="page <= 1"
      @click="page--"
    />
    <span>{{ page }} / {{ Math.max(pages, 1) }}</span>
    <UButton
      icon="i-lucide-chevron-right"
      size="xs"
      color="neutral"
      variant="ghost"
      aria-label="Next page"
      :disabled="page >= pages"
      @click="page++"
    />
  </div>
</template>
