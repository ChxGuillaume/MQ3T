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
  <div
    class="bg-accented text-muted hover:text-default flex items-center justify-center rounded-full transition-colors"
    :class="vertical ? 'h-8 w-3' : 'h-3 w-8'"
    @click="handleClick"
  >
    <UIcon
      :name="vertical ? 'i-lucide-grip-vertical' : 'i-lucide-grip-horizontal'"
      class="size-3"
    />
  </div>
</template>
