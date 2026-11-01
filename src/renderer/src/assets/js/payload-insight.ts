import type { MqttMessage } from '../../../../types/mqtt-topics'
import { toRaw } from 'vue'

export type PayloadKind = 'json' | 'number' | 'text' | 'boolean' | 'binary' | 'empty'

export type PreviewPair = { key: string; value: string; kind: PayloadKind | 'null' | 'nested' }

export const MAX_PARSE_LENGTH = 16384

export const isBinaryPayload = (message: string) => {
  const length = Math.min(message.length, 2048)

  for (let i = 0; i < length; i++) {
    const code = message.charCodeAt(i)

    if (code === 0xfffd || (code < 32 && code !== 9 && code !== 10 && code !== 13)) return true
  }

  return false
}

export const parsePayload = (message: string): { kind: PayloadKind; value: unknown } => {
  if (!message) return { kind: 'empty', value: '' }
  if (isBinaryPayload(message)) return { kind: 'binary', value: message }

  const trimmed = message.trim()

  if (trimmed === 'true' || trimmed === 'false')
    return { kind: 'boolean', value: trimmed === 'true' }
  if (trimmed !== '' && !isNaN(Number(trimmed))) return { kind: 'number', value: Number(trimmed) }

  if (message.length <= MAX_PARSE_LENGTH && /^[[{"]/.test(trimmed)) {
    try {
      const parsed = JSON.parse(trimmed)

      if (typeof parsed === 'string') return { kind: 'text', value: parsed }
      if (parsed !== null && typeof parsed === 'object') return { kind: 'json', value: parsed }
    } catch {
      return { kind: 'text', value: message }
    }
  }

  if (message.length > MAX_PARSE_LENGTH && /^[[{]/.test(trimmed)) {
    return { kind: 'json', value: null }
  }

  return { kind: 'text', value: message }
}

export const payloadKind = (message: string): PayloadKind => parsePayload(message).kind

const parsedMessages = new WeakMap<MqttMessage, { kind: PayloadKind; value: unknown }>()

export const parseMessage = (message: MqttMessage) => {
  const raw = toRaw(message)
  let parsed = parsedMessages.get(raw)

  if (!parsed) {
    parsed = parsePayload(raw.message)
    parsedMessages.set(raw, parsed)
  }

  return parsed
}

export const byteSize = (message: string) => new TextEncoder().encode(message).length

export const formatBytes = (bytes: number) => {
  if (bytes < 1000) return `${bytes} B`
  if (bytes < 1000 * 1000) return `${(bytes / 1000).toFixed(1)} kB`

  return `${(bytes / 1000 / 1000).toFixed(1)} MB`
}

export const formatCount = (count: number) => {
  if (count < 1000) return count.toString()
  if (count < 1000 * 1000) return `${(count / 1000).toFixed(count < 10000 ? 1 : 0)}k`

  return `${(count / 1000 / 1000).toFixed(1)}M`
}

export const formatAge = (ms: number) => {
  if (ms < 2000) return 'now'

  const seconds = Math.floor(ms / 1000)

  if (seconds < 60) return `${seconds} s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`

  return `${Math.floor(seconds / 86400)} d`
}

export const formatDuration = (ms: number) => {
  const seconds = Math.round(ms / 1000)

  if (seconds < 60) return `${seconds} s`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`

  return `${Math.round(seconds / 3600)} h`
}

export const formatRate = (messages: MqttMessage[]) => {
  if (messages.length < 2) return ''

  const recent = messages.slice(-20)
  const first = recent[0].createdAt.getTime()
  const last = recent[recent.length - 1].createdAt.getTime()
  const span = (last - first) / 1000

  if (span <= 0) return ''

  const perSecond = (recent.length - 1) / span

  if (perSecond >= 1) return `~${Math.round(perSecond)} msg/s`

  return `~1 msg / ${formatDuration(1000 / perSecond)}`
}

export const kindLabel = (kind: PayloadKind, dataType?: MqttMessage['dataType']) => {
  switch (kind) {
    case 'json':
      return 'JSON'
    case 'number':
      return 'Number'
    case 'boolean':
      return 'Boolean'
    case 'binary':
      return 'Binary'
    case 'empty':
      return 'Empty'
  }

  if (dataType === 'xml') return 'XML'
  if (dataType === 'yaml') return 'YAML'

  return 'Text'
}

export const compactValue = (value: unknown, max = 40): string => {
  let text: string

  if (typeof value === 'string') text = JSON.stringify(value)
  else if (value === undefined) text = 'undefined'
  else text = JSON.stringify(value) ?? String(value)

  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

const valueKind = (value: unknown): PreviewPair['kind'] => {
  if (value === null) return 'null'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'string') return 'text'

  return 'nested'
}

export const previewPairs = (value: unknown, count = 2) => {
  if (value === null || typeof value !== 'object') return { pairs: [], more: 0 }

  const entries = Array.isArray(value)
    ? value.map((item, index) => [`[${index}]`, item] as const)
    : Object.entries(value as Record<string, unknown>)

  const primitives = entries.filter(([, v]) => v === null || typeof v !== 'object')
  const nested = entries.filter(([, v]) => v !== null && typeof v === 'object')
  const shown = [...primitives, ...nested].slice(0, count)

  const pairs: PreviewPair[] = shown.map(([key, v]) => ({
    key,
    kind: valueKind(v),
    value:
      v !== null && typeof v === 'object'
        ? Array.isArray(v)
          ? `[${v.length}]`
          : `{${Object.keys(v).length}}`
        : compactValue(v, 24)
  }))

  return { pairs, more: entries.length - shown.length }
}

export const firstNumericPath = (value: unknown): string | null => {
  if (typeof value === 'number') return ''
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null

  const entry = Object.entries(value as Record<string, unknown>).find(
    ([, v]) => typeof v === 'number'
  )

  return entry ? entry[0] : null
}

export const readPath = (value: unknown, path: string): unknown => {
  if (path === '') return value

  const parts = path.match(/[^.[\]]+/g) ?? []
  let current: unknown = value

  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

export const numericValue = (message: MqttMessage, path: string): number | null => {
  if (message.message.length > MAX_PARSE_LENGTH) return null

  const { kind, value } = parseMessage(message)

  if (kind === 'number') return path === '' ? (value as number) : null
  if (kind !== 'json') return null

  const found = readPath(value, path)

  return typeof found === 'number' ? found : null
}

export const numericPaths = (value: unknown, prefix = '', depth = 0): string[] => {
  if (typeof value === 'number') return [prefix]
  if (value === null || typeof value !== 'object' || depth > 6) return []

  const entries = Array.isArray(value)
    ? value.map((item, index) => [prefix ? `${prefix}.[${index}]` : `[${index}]`, item] as const)
    : Object.entries(value as Record<string, unknown>).map(
        ([key, item]) => [prefix ? `${prefix}.${key}` : key, item] as const
      )

  return entries.flatMap(([path, item]) => numericPaths(item, path, depth + 1))
}

export const sparklinePoints = (values: number[], width = 64, height = 20) => {
  if (values.length < 2) return ''

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)

  return values
    .map((v, i) => {
      const x = Math.round(i * step * 10) / 10
      const y = Math.round((height - 2 - ((v - min) / range) * (height - 4)) * 10) / 10

      return `${x},${y}`
    })
    .join(' ')
}

export const formatPreciseTime = (
  date: Date,
  timeFormat: string,
  formatter: (d: Date) => string
) => {
  const ms = date.getMilliseconds().toString().padStart(3, '0')

  return /ss$/.test(timeFormat) ? `${formatter(date)}.${ms}` : formatter(date)
}
