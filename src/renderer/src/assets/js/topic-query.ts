import type { MqttMessage } from '../../../../types/mqtt-topics'
import { parseMessage, readPath, type PayloadKind } from './payload-insight'
import { matchTopics } from './mqtt'
import { toRaw } from 'vue'

export const CHANGING_WINDOW = 5000

export type QueryToken = { text: string; start: number; end: number }

export type TopicFacts = {
  now: number
  lastMessage: (topic: string) => MqttMessage | null
  messagesCount: (topic: string) => number
  isFavorite: (topic: string) => boolean
}

type TopicTest = (topic: string) => boolean
type FactsTest = (topic: string, facts: TopicFacts) => boolean

type TopicTerm = { stage: 'topic'; test: TopicTest; keyword?: string }

type Term = TopicTerm | { stage: 'facts'; test: FactsTest }

export type CompiledQuery = {
  topicTest: TopicTest | null
  factsTest: FactsTest | null
  highlightKeywords: string[]
  warnings: string[]
}

type Comparator = '=' | '!=' | '>' | '<' | '>=' | '<='

const PAYLOAD_KINDS: PayloadKind[] = ['json', 'number', 'text', 'boolean', 'binary', 'empty']

export const QUALIFIERS = [
  { name: 'topic:', hint: 'Topic contains text' },
  { name: 'value:', hint: 'Last payload contains text' },
  { name: 'has:', hint: 'Last JSON payload has a key' },
  { name: 'is:', hint: 'retained, changing, favorite, json, number…' },
  { name: 'qos:', hint: 'Last message QoS' },
  { name: 'age:', hint: 'Time since last message, e.g. <30s' },
  { name: 'msgs:', hint: 'Message count, e.g. >100' }
]

export const IS_VALUES = ['retained', 'changing', 'favorite', ...PAYLOAD_KINDS]

export const tokenize = (input: string): QueryToken[] => {
  const tokens: QueryToken[] = []
  let i = 0

  while (i < input.length) {
    while (i < input.length && /\s/.test(input[i])) i++
    if (i >= input.length) break

    const start = i
    let quoted = false

    while (i < input.length && (quoted || !/\s/.test(input[i]))) {
      if (input[i] === '"') quoted = !quoted
      i++
    }

    tokens.push({ text: input.slice(start, i), start, end: i })
  }

  return tokens
}

export const tokenAt = (input: string, caret: number): QueryToken => {
  const token = tokenize(input).find((t) => t.start <= caret && caret <= t.end)

  return token ?? { text: '', start: caret, end: caret }
}

const unquote = (value: string) =>
  value.length >= 2 && value.startsWith('"') && value.endsWith('"')
    ? value.slice(1, -1)
    : value.replace(/"/g, '')

const lowerCache = new WeakMap<MqttMessage, string>()

const lowerPayload = (message: MqttMessage) => {
  const raw = toRaw(message)
  let lower = lowerCache.get(raw)

  if (lower === undefined) {
    lower = raw.message.toLowerCase()
    lowerCache.set(raw, lower)
  }

  return lower
}

const compareNumbers = (a: number, op: Comparator, b: number) => {
  if (op === '=') return a === b
  if (op === '!=') return a !== b
  if (op === '>') return a > b
  if (op === '<') return a < b
  if (op === '>=') return a >= b

  return a <= b
}

const isNumeric = (value: unknown) =>
  typeof value === 'number' ||
  (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value)))

const compareValues = (actual: unknown, op: Comparator, expected: string) => {
  if (actual === undefined || (actual !== null && typeof actual === 'object')) return false

  if (isNumeric(actual) && isNumeric(expected)) {
    return compareNumbers(Number(actual), op, Number(expected))
  }

  if (op !== '=' && op !== '!=') return false

  const equal = String(actual).toLowerCase() === expected.toLowerCase()

  return op === '=' ? equal : !equal
}

const payloadAt = (message: MqttMessage | null, path: string): unknown => {
  if (!message) return undefined

  const { kind, value } = parseMessage(message)

  if (path === '') return kind === 'json' ? undefined : value
  if (kind !== 'json') return undefined

  return readPath(value, path)
}

const DURATION_UNITS: Record<string, number> = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 }

const parseDuration = (value: string): number | null => {
  const match = value.match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/)

  return match ? Number(match[1]) * DURATION_UNITS[match[2] ?? 's'] : null
}

const splitComparator = (value: string, fallback: Comparator) => {
  const match = value.match(/^(>=|<=|!=|>|<|=)?(.*)$/) as RegExpMatchArray

  return { op: (match[1] as Comparator | undefined) ?? fallback, rest: match[2] }
}

const textTerm = (value: string): Term => {
  if (/[+#]/.test(value)) return { stage: 'topic', test: (topic) => matchTopics(value, topic) }

  const keyword = value.toLowerCase()

  return { stage: 'topic', test: (topic) => topic.toLowerCase().includes(keyword), keyword }
}

const isTerm = (value: string): Term | string => {
  const kind = value.toLowerCase()

  if (kind === 'retained') {
    return { stage: 'facts', test: (topic, facts) => !!facts.lastMessage(topic)?.retained }
  }

  if (kind === 'changing') {
    return {
      stage: 'facts',
      test: (topic, facts) => {
        const last = facts.lastMessage(topic)

        return !!last && last.createdAt.getTime() >= facts.now - CHANGING_WINDOW
      }
    }
  }

  if (kind === 'favorite')
    return { stage: 'facts', test: (topic, facts) => facts.isFavorite(topic) }

  if ((PAYLOAD_KINDS as string[]).includes(kind)) {
    return {
      stage: 'facts',
      test: (topic, facts) => {
        const last = facts.lastMessage(topic)

        return last ? parseMessage(last).kind === kind : kind === 'empty'
      }
    }
  }

  return `Unknown is:${value}, try ${IS_VALUES.join(', ')}`
}

const qualifierTerm = (name: string, rawValue: string): Term | string | null => {
  const value = unquote(rawValue)

  if (name === 'topic') return value ? textTerm(value) : 'topic: needs a value'

  if (name === 'value' || name === 'payload') {
    if (!value) return `${name}: needs a value`

    const needle = value.toLowerCase()

    return {
      stage: 'facts',
      test: (topic, facts) => {
        const last = facts.lastMessage(topic)

        return !!last && lowerPayload(last).includes(needle)
      }
    }
  }

  if (name === 'has') {
    if (!value) return 'has: needs a key, e.g. has:battery'

    return {
      stage: 'facts',
      test: (topic, facts) => payloadAt(facts.lastMessage(topic), value) !== undefined
    }
  }

  if (name === 'is') return isTerm(value)

  if (name === 'qos') {
    if (!/^[012]$/.test(value)) return 'qos: expects 0, 1 or 2'

    const qos = Number(value)

    return { stage: 'facts', test: (topic, facts) => facts.lastMessage(topic)?.qos === qos }
  }

  if (name === 'age') {
    const { op, rest } = splitComparator(value, '<')
    const duration = parseDuration(rest)

    if (duration === null) return 'age: expects a duration, e.g. age:<30s or age:>1h'

    return {
      stage: 'facts',
      test: (topic, facts) => {
        const last = facts.lastMessage(topic)

        return !!last && compareNumbers(facts.now - last.createdAt.getTime(), op, duration)
      }
    }
  }

  if (name === 'msgs') {
    const { op, rest } = splitComparator(value, '>=')

    if (!isNumeric(rest)) return 'msgs: expects a number, e.g. msgs:>100'

    const count = Number(rest)

    return {
      stage: 'facts',
      test: (topic, facts) => compareNumbers(facts.messagesCount(topic), op, count)
    }
  }

  return null
}

const compareTerm = (text: string): Term | null => {
  if (text.includes('/')) return null

  const match = text.match(/^([\w$.[\]-]*?)(>=|<=|!=|=|>|<)(.+)$/)

  if (!match) return null

  const [, path, op, rawExpected] = match
  const expected = unquote(rawExpected)

  return {
    stage: 'facts',
    test: (topic, facts) =>
      compareValues(payloadAt(facts.lastMessage(topic), path), op as Comparator, expected)
  }
}

const regexTerm = (text: string): Term | string | null => {
  const match = text.match(/^\/(.+)\/([imsu]*)$/)

  if (!match) return null

  try {
    const regex = new RegExp(match[1], match[2].includes('i') ? match[2] : `${match[2]}i`)

    return { stage: 'topic', test: (topic) => regex.test(topic) }
  } catch {
    return `Invalid regex ${text}`
  }
}

const parseTerm = (text: string, warnings: string[]): Term | null => {
  const regex = regexTerm(text)

  if (typeof regex === 'string') {
    warnings.push(regex)
    return null
  }
  if (regex) return regex

  const qualifier = text.match(/^([a-z]+):(.*)$/i)

  if (qualifier) {
    const term = qualifierTerm(qualifier[1].toLowerCase(), qualifier[2])

    if (typeof term === 'string') {
      warnings.push(term)
      return null
    }
    if (term) return term

    warnings.push(`Unknown qualifier ${qualifier[1]}:, searched as topic text`)
  }

  return compareTerm(text) ?? textTerm(unquote(text))
}

const negate = (term: Term): Term =>
  term.stage === 'topic'
    ? { stage: 'topic', test: (topic) => !term.test(topic) }
    : { stage: 'facts', test: (topic, facts) => !term.test(topic, facts) }

const runTerm = (term: Term, topic: string, facts: TopicFacts) =>
  term.stage === 'topic' ? term.test(topic) : term.test(topic, facts)

export const compileQuery = (input: string): CompiledQuery => {
  const warnings: string[] = []
  const groups: Term[][] = []
  const highlightKeywords: string[] = []
  let joinNext = false

  for (const { text } of tokenize(input)) {
    if (text === '|' || text === 'OR') {
      if (groups.length) joinNext = true
      else warnings.push(`${text} needs a term on both sides`)
      continue
    }

    const negated = text.length > 1 && text.startsWith('-')
    const parsed = parseTerm(negated ? text.slice(1) : text, warnings)

    if (!parsed) continue
    if (!negated && parsed.stage === 'topic' && parsed.keyword)
      highlightKeywords.push(parsed.keyword)

    const term = negated ? negate(parsed) : parsed

    if (joinNext) groups[groups.length - 1].push(term)
    else groups.push([term])

    joinNext = false
  }

  if (joinNext) warnings.push('OR at the end of the query is ignored')

  const isTopicGroup = (group: Term[]): group is TopicTerm[] =>
    group.every((term) => term.stage === 'topic')

  const topicTests = groups.filter(isTopicGroup).map((group) => group.map((term) => term.test))
  const factsGroups = groups.filter((group) => !isTopicGroup(group))

  const topicTest: TopicTest | null = topicTests.length
    ? (topic) => topicTests.every((group) => group.some((test) => test(topic)))
    : null

  const factsTest: FactsTest | null = factsGroups.length
    ? (topic, facts) =>
        factsGroups.every((group) => group.some((term) => runTerm(term, topic, facts)))
    : null

  return { topicTest, factsTest, highlightKeywords, warnings }
}

export const payloadPaths = (
  value: unknown,
  prefix = '',
  depth = 0,
  out: string[] = []
): string[] => {
  if (value === null || typeof value !== 'object' || depth > 3 || out.length > 200) return out

  const entries = Array.isArray(value)
    ? value.slice(0, 3).map((item, index) => [`${prefix}[${index}]`, item] as const)
    : Object.entries(value as Record<string, unknown>).map(
        ([key, item]) => [prefix ? `${prefix}.${key}` : key, item] as const
      )

  for (const [path, item] of entries) {
    out.push(path)
    payloadPaths(item, path, depth + 1, out)
  }

  return out
}
