<script setup lang="ts">
import { useQuasar } from 'quasar'

const $q = useQuasar()

const emits = defineEmits(['click'])

const handleClick = () => {
  emits('click')
  $q.notify({
    message: 'Copied to clipboard',
    color: 'positive',
    icon: 'fa-solid fa-check'
  })
}
</script>

<template>
  <q-btn size="sm" color="secondary" flat round icon="fa-solid fa-copy" @click="handleClick">
    <q-tooltip>Copy to clipboard</q-tooltip>
  </q-btn>
</template>

<style scoped lang="less"></style>
