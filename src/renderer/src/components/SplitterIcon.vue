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
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0.75rem;
}

.icon.horizontal {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  height: 12px;
}

.icon.vertical {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  display: flex;
  width: 12px;
}

.body--light {
  .icon {
    background-color: #e5e5e5;
    color: black;
  }
}

.body--dark {
  .icon {
    background-color: #525252;
    color: white;
  }
}
</style>
