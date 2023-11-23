<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  vertical?: boolean
}>()

const emit = defineEmits<{
  'click:double': []
}>()

const clickTimeout = ref<NodeJS.Timeout | null>(null)

const handleClick = () => {
  if (clickTimeout.value) {
    clearTimeout(clickTimeout.value)
    clickTimeout.value = null

    emit('click:double')
  } else {
    clickTimeout.value = setTimeout(() => {
      clickTimeout.value = null
    }, 250)
  }
}
</script>

<template>
  <div class="icon" :class="{ vertical, horizontal: !vertical }" @click="handleClick">
    <q-icon v-if="!vertical" size="12px" name="fa-solid fa-ellipsis" />
    <q-icon v-else size="12px" name="fa-solid fa-ellipsis-vertical" />
  </div>
</template>

<style scoped lang="less">
.icon {
  @apply tw-flex tw-justify-center tw-items-center tw-rounded-xl;
}

.icon.horizontal {
  @apply tw-px-3;
  height: 12px;
}

.icon.vertical {
  @apply tw-py-3 tw-flex;
  width: 12px;
}

.body--light {
  .icon {
    @apply tw-bg-neutral-200 tw-text-black;
  }
}

.body--dark {
  .icon {
    @apply tw-bg-neutral-600 tw-text-white;
  }
}
</style>
