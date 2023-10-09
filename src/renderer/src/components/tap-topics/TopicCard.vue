<script setup lang="ts">
import { useSettingsStore } from '../../store/settings-store'
import { computed, ref } from 'vue'

const settingsStore = useSettingsStore()

export interface ITopicCard {
  animate: () => void
}

defineProps<{
  active?: boolean
  opened?: boolean
  expandable?: boolean
}>()

defineEmits(['open:toggle'])

const doAnimate = ref(false)
const animationDuration = computed(() => settingsStore.showActivityAnimationSpeed)
const animationDurationMs = computed(() => `${animationDuration.value}ms`)
const animationLastTime = ref(0)

const animate = () => {
  if (doAnimate.value) {
    if (Date.now() - animationLastTime.value < animationDuration.value) return
    else doAnimate.value = false
  }

  doAnimate.value = true
  animationLastTime.value = Date.now()

  setTimeout(() => {
    doAnimate.value = false
  }, animationDuration.value)
}

defineExpose({ animate })
</script>

<template>
  <q-card
    flat
    class="topic-item-card card-secondary-background tw-pr-3 tw-select-none"
    :class="{ active, opened, 'tw-pl-1': expandable, 'tw-pl-3': !expandable, animate: doAnimate }"
    @click.stop="$emit('open:toggle')"
  >
    <q-icon
      v-if="expandable"
      name="fa-solid fa-caret-right"
      size="xs"
      class="expand-icon tw-mr-1"
    />
    <slot />
  </q-card>
</template>

<style scoped lang="less">
.opened {
  .expand-icon {
    transform: rotate(90deg);
  }
}

.topic-item-card {
  @apply tw-py-1 tw-line-clamp-1 tw-break-all tw-cursor-pointer tw-transition-colors tw-text-neutral-500;
}

@keyframes slideIn {
  from {
    //transform: translateX(-100%);
    left: -250px;
  }
  to {
    //transform: translateX(100%);
    left: calc(100% + 250px);
  }
}

.topic-item-card:before {
  content: '';

  @apply tw-absolute tw-top-0 tw-h-full;
  z-index: 1;

  width: 250px;
  left: -250px;
}

.topic-item-card.animate:before {
  animation: cubic-bezier(0.16, 0.78, 0.62, 0.92) 1s slideIn;
  animation-duration: v-bind(animationDurationMs);
}

.body--light {
  .topic-item-card:before {
    background: rgb(255, 255, 255);
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.05) 20%,
      rgba(101, 1, 100, 0.4) 80%,
      rgba(101, 1, 100, 0) 100%
    );
  }

  .topic-item-card {
    @apply tw-text-neutral-500;
  }

  .topic-item-card:hover {
    background: #65016433 !important;
  }

  .topic-item-card.active {
    background: #65016455 !important;
  }
}

.body--dark {
  .topic-item-card:before {
    background: rgb(0, 0, 0);
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 0.05) 20%,
      rgba(101, 1, 100, 0.5) 80%,
      rgba(101, 1, 100, 0) 100%
    );
  }

  .topic-item-card {
    @apply tw-text-neutral-400;
  }
  .topic-item-card:hover {
    background: #65016488 !important;
  }

  .topic-item-card.active {
    background: #650164ee !important;
  }
}
</style>
