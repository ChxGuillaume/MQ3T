<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  opened: boolean
  version: string
}>()

const emit = defineEmits<{
  'update:opened': [boolean]
  download: []
}>()

const dialogOpened = computed({
  get: () => props.opened,
  set: (val) => {
    emit('update:opened', val)
  }
})

const handleUpdateDownload = () => {
  emit('download')
  dialogOpened.value = false
}
</script>

<template>
  <q-dialog v-model="dialogOpened">
    <q-card flat>
      <q-card-section class="tw-max-w-[300px]">
        <h1 class="tw-text-xl">Update Available</h1>
        <p class="tw-mt-2 color-details">Version {{ props.version }} is available for download.</p>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="Later" flat @click="dialogOpened = false" />
        <q-btn label="Download" color="primary" @click="handleUpdateDownload" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="less"></style>
