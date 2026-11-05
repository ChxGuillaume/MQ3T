<script setup lang="ts">
import {
  byteSize,
  formatBytes,
  InlineToken,
  InlineTokenKind,
  inlineJsonTokens,
  inlineXmlTokens,
  parseMessage
} from '@renderer/assets/js/payload-insight'
import type { MqttMessage } from '@renderer/store/mqtt-topics'
import { computed } from 'vue'

const MAX_LENGTH = 400

const TOKEN_CLASS: Record<InlineTokenKind, string> = {
  key: 'text-code-key',
  str: 'text-code-str',
  num: 'text-code-num',
  sym: 'text-code-sym',
  tag: 'text-code-key',
  punct: 'text-muted font-medium',
  text: 'text-default'
}

const props = defineProps<{ message: MqttMessage | null }>()

const display = computed((): { tokens: InlineToken[]; color: string } | null => {
  if (!props.message) return null

  const { kind, value } = parseMessage(props.message)
  const single = (text: string, color: string) => ({
    tokens: [{ text, kind: 'text' as const }],
    color
  })
  const size = () => formatBytes(byteSize(props.message!.message))

  switch (kind) {
    case 'json':
      return value === null
        ? single(`JSON · ${size()}`, 'text-muted')
        : { tokens: inlineJsonTokens(value, MAX_LENGTH), color: '' }
    case 'number':
      return single(String(value), 'text-code-num')
    case 'boolean':
      return single(String(value), 'text-code-sym')
    case 'binary':
      return single(`binary · ${size()}`, 'text-code-bin')
    case 'empty':
      return single('empty', 'text-dimmed italic')
  }

  if (props.message.dataType === 'xml') {
    return { tokens: inlineXmlTokens(props.message.message, MAX_LENGTH), color: '' }
  }

  const text = String(value).replace(/\s+/g, ' ')

  return single(
    text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH - 1)}…` : text,
    'text-code-str'
  )
})
</script>

<template>
  <span
    v-if="display"
    class="min-w-0 truncate font-mono text-xs font-bold whitespace-pre"
    :class="display.color"
  >
    <template v-if="display.color">{{ display.tokens[0].text }}</template>
    <span
      v-for="(token, index) in display.tokens"
      v-else
      :key="index"
      :class="TOKEN_CLASS[token.kind]"
      v-text="token.text"
    />
  </span>
</template>
