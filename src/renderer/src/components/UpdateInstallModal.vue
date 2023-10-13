<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  opened: boolean
}>()

const emit = defineEmits<{
  'update:opened': [boolean]
  install: []
}>()

const dialogOpened = computed({
  get: () => props.opened,
  set: (val) => {
    emit('update:opened', val)
  }
})

const handleUpdateInstall = () => {
  emit('install')
  dialogOpened.value = false
}
</script>

<template>
  <q-dialog v-model="dialogOpened">
    <q-card flat>
      <q-card-section class="tw-max-w-[320px]">
        <h1 class="tw-text-xl">Update Downloaded</h1>
        <p class="tw-mt-2 color-details">
          A new version of MQ3T has been downloaded and is ready to be installed.
        </p>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="Later" flat @click="dialogOpened = false" />
        <q-btn label="Install" color="primary" @click="handleUpdateInstall" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="less"></style>
