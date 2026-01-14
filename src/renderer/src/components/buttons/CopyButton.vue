<script setup lang="ts">
import { useQuasar } from 'quasar'

const $q = useQuasar()

const props = defineProps<{ text?: string; notificationMessage?: string }>()
const emits = defineEmits(['click'])

const handleClick = () => {
  emits('click')

  $q.notify({
    message: props.notificationMessage || 'Copied to clipboard',
    icon: 'fa-solid fa-clipboard',
    color: 'positive'
  })
}
</script>

<template>
  <q-btn size="sm" color="secondary" flat round icon="fa-solid fa-copy" @click.stop="handleClick">
    <q-tooltip class="tw-bg-secondary tw-text-black" :offset="[5, 5]">
      <slot>{{ text || 'Copy to clipboard' }}</slot>
    </q-tooltip>
  </q-btn>
</template>

<style scoped lang="less"></style>
