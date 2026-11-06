<script setup lang="ts">
import { SentencePart } from '../chain-step-help'

defineProps<{ parts: SentencePart[] }>()
</script>

<template>
  <p class="bg-primary/5 border-primary/20 rounded-md border p-2.5 text-[13px] leading-relaxed">
    <template v-for="(part, index) in parts" :key="index">
      <template v-if="typeof part === 'string'">{{ part }}</template>
      <code
        v-else-if="'code' in part"
        class="bg-default text-primary rounded-xs px-1 font-mono text-xs break-all"
      >
        {{ part.code }}
      </code>
      <span v-else class="text-warning italic">{{ part.placeholder }}</span>
    </template>
  </p>
</template>
