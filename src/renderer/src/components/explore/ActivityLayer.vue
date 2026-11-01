<script setup lang="ts">
import { useSettingsStore } from '@renderer/store/settings-store'
import { computed, onBeforeUnmount, ref } from 'vue'
import debounce from 'lodash/debounce'

const props = defineProps<{ tone?: 'default' | 'action' | 'active' }>()

const settingsStore = useSettingsStore()

const tick = ref(0)
const running = ref(false)

let stopTimeout: NodeJS.Timeout | undefined

const color = computed(() => {
  if (props.tone === 'action') return 'var(--color-accent)'
  if (props.tone === 'active') return 'var(--ui-text-highlighted)'

  return 'var(--ui-success)'
})

const style = computed(() => ({
  '--activity-color': color.value,
  '--activity-duration': `${settingsStore.showActivityAnimationSpeed}ms`
}))

const rawAnimate = () => {
  if (!settingsStore.showActivity) return

  const duration = settingsStore.showActivityAnimationSpeed

  if (settingsStore.showActivityAnimationType === 'laser' && running.value) return

  tick.value++
  running.value = true

  clearTimeout(stopTimeout)
  stopTimeout = setTimeout(() => (running.value = false), duration)
}

const animate = debounce(rawAnimate, 100, { leading: true, trailing: true, maxWait: 100 })

onBeforeUnmount(() => {
  animate.cancel()
  clearTimeout(stopTimeout)
})

defineExpose({ animate })
</script>

<template>
  <span
    v-if="running"
    :key="tick"
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    :style="style"
  >
    <span
      :class="
        settingsStore.showActivityAnimationType === 'laser' ? 'activity-laser' : 'activity-heat'
      "
    />
  </span>
</template>

<style scoped>
.activity-laser {
  position: absolute;
  top: 0;
  left: -250px;
  height: 100%;
  width: 250px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in oklab, var(--activity-color) 8%, transparent),
    color-mix(in oklab, var(--activity-color) 45%, transparent),
    transparent
  );
  animation: activity-slide var(--activity-duration) cubic-bezier(0.16, 0.78, 0.62, 0.92) forwards;
}

.activity-heat {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--activity-color) 30%, transparent) 0%,
    color-mix(in oklab, var(--activity-color) 10%, transparent) 50%,
    transparent 100%
  );
  animation: activity-fade var(--activity-duration) ease-out forwards;
}

@keyframes activity-slide {
  from {
    left: -250px;
  }
  to {
    left: calc(100% + 250px);
  }
}

@keyframes activity-fade {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
