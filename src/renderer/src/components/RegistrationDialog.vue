<script setup lang="ts">
import { computed } from 'vue'
import { ElectronApi } from '@renderer/assets/js/electron-api'

const props = defineProps<{
  opened: boolean
  pin: string
}>()

const emit = defineEmits<{
  'update:opened': [boolean]
}>()

const dialogOpened = computed({
  get: () => props.opened,
  set: (val) => {
    emit('update:opened', val)
  }
})

const handleCancel = async () => {
  try {
    await ElectronApi.cancelRegistration()
  } catch (error) {
    console.error('Failed to cancel registration:', error)
    dialogOpened.value = false
  }
}
</script>

<template>
  <q-dialog v-model="dialogOpened" @close="handleCancel">
    <q-card flat>
      <q-card-section class="tw-max-w-[300px] tw-text-center">
        <h1 class="text-weight-bold tw-text-xl">Registration Request</h1>

        <p class="color-details tw-mt-2 tw-text-xs">
          An attempt to link the mobile companion to your desktop app has been initiated
        </p>

        <div class="tw-mt-4 tw-flex tw-w-full tw-justify-center tw-gap-2">
          <span
            v-for="[pin, index] in props.pin"
            :key="index"
            class="tw-w-10 tw-rounded tw-bg-neutral-100 tw-py-2 tw-text-center tw-text-3xl dark:tw-bg-neutral-800 dark:tw-text-white"
          >
            {{ pin }}
          </span>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="less"></style>
