<script setup lang="ts">
import { ElectronApi } from '../assets/js/electron-api'
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const updateProgressNotify = ref<ReturnType<typeof $q.notify> | null>(null)
const updateCheckNotify = ref<ReturnType<typeof $q.notify> | null>(null)

onMounted(() => {
  ElectronApi.handleCheckForUpdates((_, value) => {
    console.log(value)
    updateProgressNotify.value = null

    updateCheckNotify.value = $q.notify({
      message: 'Checking for updates...',
      icon: 'fa-solid fa-download',
      color: 'primary',
      type: 'ongoing'
    })
  })

  ElectronApi.handleUpdateError((_, value) => {
    console.log(value.name, value.message)

    $q.notify({
      message: 'Error checking for updates',
      caption: value.message,
      icon: 'fa-solid fa-download',
      color: 'negative',
      timeout: 1000
    })
  })

  ElectronApi.handleUpdateNotAvailable(() => {
    const notify = updateCheckNotify.value || $q.notify

    notify({
      message: 'No update available',
      caption: 'You are running the latest version',
      icon: 'fa-solid fa-download',
      color: 'secondary',
      type: 'positive',
      timeout: 1000
    })
  })

  ElectronApi.handleUpdateAvailable((_, value) => {
    const notify = updateCheckNotify.value || $q.notify

    notify({
      message: 'Update available',
      caption: `Version ${value.version} is available`,
      icon: 'fa-solid fa-download',
      color: 'primary',
      type: 'positive',
      timeout: 1000
    })
  })

  ElectronApi.handleUpdateDownloaded((_, value) => {
    const notifyProgress = updateProgressNotify.value

    $q.notify({
      message: 'Update downloaded',
      caption: `Version ${value.version} is ready to be installed`,
      icon: 'fa-solid fa-download',
      color: 'primary',
      type: 'positive',
      timeout: 1000
    })

    if (notifyProgress) notifyProgress()
  })

  ElectronApi.handleUpdateDownloadProgress((_, value) => {
    const notify = updateProgressNotify.value || $q.notify

    const transferred = value.transferred / 1024 / 1024
    const speed = value.bytesPerSecond / 1024 / 1024
    const total = value.total / 1024 / 1024

    const speedMessage = `${speed.toFixed(2)} MB/s`
    const percentMessage = `${value.percent.toFixed(2)}%`
    const totalTransferred = `${transferred.toFixed(2)} MB / ${total.toFixed(2)} MB`

    const notifyRes = notify({
      message: 'Downloading update...',
      caption: `${percentMessage} - ${speedMessage}<br>${totalTransferred}`,
      icon: 'fa-solid fa-download',
      color: 'primary',
      type: 'ongoing',
      html: true
    })

    if (!updateProgressNotify.value) updateProgressNotify.value = notifyRes!
  })
})
</script>

<template></template>

<style scoped lang="less"></style>
