<script setup lang="ts">
defineProps<{ favorite: boolean; size?: 'sm' | 'md' }>()

defineEmits<{ click: [] }>()
</script>

<template>
  <UTooltip :text="favorite ? 'Unfavorite' : 'Favorite'">
    <UButton
      color="neutral"
      variant="ghost"
      :size="size === 'sm' ? 'xs' : 'md'"
      :aria-label="favorite ? 'Unfavorite' : 'Favorite'"
      :aria-pressed="favorite"
      :class="favorite ? 'text-primary' : 'text-muted'"
      @click.stop="$emit('click')"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        :fill="favorite ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
        :class="size === 'sm' ? 'size-3.5' : 'size-4'"
      >
        <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />
      </svg>
    </UButton>
  </UTooltip>
</template>
