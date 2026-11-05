<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ value?: number; size?: number }>(), { size: 18 })

const RADIUS = 9
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const dashOffset = computed(() =>
  props.value === undefined
    ? CIRCUMFERENCE * 0.7
    : CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, props.value)))
)
</script>

<template>
  <svg
    role="progressbar"
    :aria-valuenow="value === undefined ? undefined : Math.round(value * 100)"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :class="{ 'animate-spin': value === undefined }"
  >
    <circle
      cx="12"
      cy="12"
      :r="RADIUS"
      stroke="currentColor"
      stroke-opacity="0.2"
      stroke-width="3"
    />
    <circle
      cx="12"
      cy="12"
      :r="RADIUS"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      :stroke-dasharray="CIRCUMFERENCE"
      :stroke-dashoffset="dashOffset"
      transform="rotate(-90 12 12)"
      class="transition-[stroke-dashoffset] duration-200 ease-linear"
    />
  </svg>
</template>
