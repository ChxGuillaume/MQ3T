<script setup lang="ts">
import { useHighlightTheme } from '@renderer/composables/useHighlightTheme'
import { useAppColorMode } from '@renderer/composables/useAppColorMode'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { watch } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const { isDark } = useAppColorMode()

useHighlightTheme()

watch(
  isDark,
  (value) => {
    $q.dark.set(value)
    ElectronApi.darkMode(value)
  },
  { immediate: true }
)
</script>

<template>
  <UApp :toaster="{ position: 'bottom-center', duration: 2500 }">
    <router-view />
  </UApp>
</template>
