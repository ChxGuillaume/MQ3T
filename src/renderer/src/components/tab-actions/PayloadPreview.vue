<script setup lang="ts">
import { highlightPayload } from './action-utils'
import { Action } from '../../../../types/actions'
import { computed } from 'vue'

const props = defineProps<{
  payload: string
  format?: Action['payloadFormat']
  dense?: boolean
}>()

const html = computed(() => highlightPayload(props.payload, props.format))
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <pre
    class="bg-muted m-0 overflow-auto rounded-lg font-mono break-all whitespace-pre-wrap"
    :class="dense ? 'px-3 py-2.5 text-xs leading-[19px]' : 'px-3.5 py-3 text-[13px] leading-[22px]'"
    v-html="html || '&nbsp;'"
  />
</template>
