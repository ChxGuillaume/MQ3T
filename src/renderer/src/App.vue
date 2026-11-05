<script setup lang="ts">
import { useAppColorMode } from '@renderer/composables/useAppColorMode'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { watch } from 'vue'

const { isDark } = useAppColorMode()

watch(isDark, (value) => ElectronApi.darkMode(value), { immediate: true })
</script>

<template>
  <UApp :toaster="{ position: 'bottom-center', duration: 2500 }">
    <router-view />
  </UApp>
</template>
