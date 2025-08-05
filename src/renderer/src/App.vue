<script setup lang="ts">
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { onBeforeMount, watch } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

watch(
  () => $q.dark.isActive,
  (isDark) => ElectronApi.darkMode(isDark)
)

onBeforeMount(() => ElectronApi.darkMode($q.dark.isActive))
</script>

<template>
  <router-view />
</template>

<style lang="less"></style>
