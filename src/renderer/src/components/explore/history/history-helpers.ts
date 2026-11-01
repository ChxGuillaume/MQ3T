import {
  compactValue,
  firstNumericPath,
  numericValue,
  parseMessage
} from '@renderer/assets/js/payload-insight'
import { diffMessages, filterChanges, JsonChange } from '@renderer/assets/js/json-diff'
import type { MqttMessage } from '@renderer/store/mqtt-topics'

export const messagePreview = (message: MqttMessage) => {
  const parsed = parseMessage(message)

  if (parsed.kind === 'json' && parsed.value && !Array.isArray(parsed.value)) {
    return Object.entries(parsed.value as Record<string, unknown>)
      .slice(0, 6)
      .map(([key, value]) => `${key} ${compactValue(value, 24)}`)
      .join(' · ')
  }

  if (parsed.kind === 'text') return String(parsed.value).slice(0, 300)
  if (parsed.kind === 'empty') return '(empty)'

  return message.message.slice(0, 300)
}

export const numericDelta = (
  message: MqttMessage,
  previous: MqttMessage | undefined,
  path: string | null
) => {
  if (!previous || path === null) return null

  const current = numericValue(message, path)
  const before = numericValue(previous, path)

  if (current === null || before === null) return null

  const delta = current - before

  if (delta === 0) return 'same'

  const rounded = Math.round(delta * 1000) / 1000

  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}`
}

export const deltaPath = (latest: MqttMessage | undefined) =>
  latest ? firstNumericPath(parseMessage(latest).value) : null

export type MessageWithChanges = {
  message: MqttMessage
  previous?: MqttMessage
  changes: JsonChange[]
}

export const withChanges = (
  newestFirst: MqttMessage[],
  keyFilters: string[] = []
): MessageWithChanges[] =>
  newestFirst.map((message, index) => {
    const previous = newestFirst[index + 1]

    return {
      message,
      previous,
      changes: previous
        ? filterChanges(diffMessages(previous.message, message.message), keyFilters)
        : []
    }
  })

export const changesLabel = (count: number) => {
  if (count === 0) return 'no change'

  return `${count} ${count === 1 ? 'change' : 'changes'}`
}
