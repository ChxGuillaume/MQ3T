<script setup lang="ts">
import { useSettingsStore } from '../../store/settings-store'
import { computed, ref, onBeforeUnmount } from 'vue'
import { useAppStore } from '../../store/app-store'
import { useQuasar } from 'quasar'
import debounce from 'lodash/debounce'

const settingsStore = useSettingsStore()
const appStore = useAppStore()

const $q = useQuasar()

export interface ITopicCard {
  animate: () => void
}

const props = defineProps<{
  active?: boolean
  opened?: boolean
  favorite?: boolean
  expandable?: boolean
  hasActions?: boolean
}>()

defineEmits(['open:toggle'])

const doAnimate = ref(false)
const animationDuration = computed(() => settingsStore.showActivityAnimationSpeed)
const animationDurationMs = computed(() => `${animationDuration.value}ms`)
const animationLastTime = ref(0)

const topicHeatInterval = ref<NodeJS.Timeout | undefined>()
const topicHeatPercentage = ref(-10)

const animationColor = computed(() => {
  if (props.hasActions) return '230, 117, 228'
  else if (props.active) return $q.dark.isActive ? '255, 255, 255' : '0, 0, 0'

  return '117, 230, 124'
})

const topicHeatFadeGradiant = computed(() => {
  return `linear-gradient(
    90deg,
    rgba(${animationColor.value}, 0.3) 0%,
    rgba(${animationColor.value}, 0.1) ${topicHeatPercentage.value}%,
    rgba(${animationColor.value}, 0) ${topicHeatPercentage.value + 10}%
  )`
})

const handleTopicHeat = () => {
  topicHeatPercentage.value = 110
  if (!topicHeatInterval.value) {
    topicHeatInterval.value = setInterval(() => {
      topicHeatPercentage.value -= 1
      if (topicHeatPercentage.value < -10) {
        clearInterval(topicHeatInterval.value)
        topicHeatInterval.value = undefined
      }
    }, animationDuration.value / 120)
  }
}

const handleLaser = () => {
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

const rawAnimate = () => {
  const type = settingsStore.showActivityAnimationType

  if (type === 'topic-heat') handleTopicHeat()
  else if (type === 'laser') handleLaser()
}

const animate = debounce(rawAnimate, 100, { leading: true, trailing: true, maxWait: 100 })

onBeforeUnmount(() => animate.cancel())

defineExpose<{ animate: () => void }>({ animate })
</script>

<template>
  <q-card
    flat
    class="topic-item-card card-secondary-background tw-select-none tw-pr-3"
    :class="[
      { active },
      { opened },
      { animate: doAnimate },
      { 'tw-pl-1': expandable },
      { 'tw-pl-3': !expandable },
      { 'not-scrubbing': !appStore.isScrubbingTopics },
      `animation-${settingsStore.showActivityAnimationType}`
    ]"
    @click.stop="$emit('open:toggle')"
  >
    <q-icon
      v-if="expandable"
      name="fa-solid fa-caret-right"
      size="xs"
      class="expand-icon topic-item-icon"
    />
    <q-icon v-if="hasActions" name="fa-solid fa-play" class="topic-item-icon tw-text-accent" />
    <q-icon v-if="favorite" name="fa-solid fa-star" class="topic-item-icon tw-text-yellow-500" />
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
  @apply tw-flex tw-cursor-pointer tw-items-center tw-overflow-hidden tw-whitespace-nowrap tw-break-all tw-py-1 tw-text-neutral-500;
}

.topic-item-card.not-scrubbing {
  @apply tw-transition-colors;
}

.topic-item-icon {
  @apply tw-h-4;

  margin-right: 5px;
  margin-bottom: 2px;
}

@keyframes slideIn {
  from {
    //transform: translateX(-250px);
    left: -250px;
  }
  to {
    //transform: translateX(100% + 250px);
    left: calc(100% + 250px);
  }
}

.topic-item-card:before {
  content: '';

  @apply tw-absolute tw-top-0 tw-h-full;
  z-index: 1;
}

.topic-item-card.animation-laser:before {
  width: 250px;
  left: -250px;
}

.topic-item-card.animation-topic-heat:before {
  width: 100%;
  left: 0;

  background: rgb(255, 255, 255);
  background: v-bind(topicHeatFadeGradiant);
}

.topic-item-card.animation-laser.animate:before {
  animation: cubic-bezier(0.16, 0.78, 0.62, 0.92) 1s slideIn;
  animation-duration: v-bind(animationDurationMs);
}

.body--light {
  .topic-item-card.animation-laser:before {
    --color: v-bind(animationColor);

    background: rgb(255, 255, 255);
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0),
      rgba(255, 255, 255, 0.05),
      rgba(var(--color), 0.4),
      rgba(255, 255, 255, 0)
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
  .topic-item-card.animation-laser:before {
    --color: v-bind(animationColor);

    background: rgb(0, 0, 0);
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0),
      rgba(0, 0, 0, 0.05),
      rgba(var(--color), 0.5),
      rgba(0, 0, 0, 0)
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
