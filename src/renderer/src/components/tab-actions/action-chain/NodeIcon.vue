<script setup lang="ts">
defineProps<{
  isRunning: boolean
  isFinished: boolean
  icon: string
}>()
</script>

<template>
  <div class="tw-relative tw-w-[20px] tw-h-[20px]">
    <transition appear name="slide-up">
      <q-circular-progress v-if="isRunning" indeterminate :thickness="0.4" class="progress-icon" />
      <q-icon v-else-if="isFinished" name="fa-solid fa-check" color="green" class="progress-icon" />
      <q-icon v-else :name="icon" class="progress-icon" />
    </transition>
  </div>
</template>

<style scoped lang="less">
.progress-icon {
  top: 2px;
  @apply tw-absolute tw-left-0 tw-right-0 tw-bottom-0 tw-mx-auto tw-align-middle;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
