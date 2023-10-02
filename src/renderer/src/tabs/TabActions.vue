<script setup lang="ts">
import { ElectronIpc } from '../../../types/electron-ipc-callbacks'

const electronApi = window.api as ElectronIpc

const sendTestMessage = () => {
  electronApi.sendMqttMessage(
    'connection-76e2b6fa-995a-4daf-babd-51e0eda162ad',
    'nekotiki/actions/message',
    JSON.stringify({ message: 'test' })
  )
}
</script>

<template>
  <div class="actions">
    <div class="tw-mb-3 tw-flex tw-justify-between tw-items-center">
      <h1 class="tw-text-xl tw-font-bold">Actions</h1>
    </div>
    <q-btn color="primary" @click="sendTestMessage">
      <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-plus" />
      Send Test Message
    </q-btn>
  </div>
</template>

<style scoped lang="less"></style>
