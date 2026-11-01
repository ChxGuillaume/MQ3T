<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  opened: boolean
  version: string
}>()

const emit = defineEmits<{
  'update:opened': [boolean]
  seeChangeLogs: []
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
      <q-card-section class="max-w-[300px]">
        <h1 class="text-xl">Update Available</h1>
        <p class="color-details mt-2">Version {{ props.version }} is available for download.</p>
      </q-card-section>
      <q-card-actions align="between">
        <q-btn class="text-secondary justify-self-start" flat round @click="emit('seeChangeLogs')">
          <q-tooltip
            class="bg-secondary text-black"
            anchor="center right"
            self="center left"
            :offset="[5, 0]"
          >
            Change Logs
          </q-tooltip>
          <q-icon size="xs" name="fa-solid fa-note-sticky" />
        </q-btn>
        <div class="flex gap-2">
          <q-btn label="Later" flat @click="dialogOpened = false" />
          <q-btn label="Download" color="primary" @click="handleUpdateDownload" />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="less"></style>
