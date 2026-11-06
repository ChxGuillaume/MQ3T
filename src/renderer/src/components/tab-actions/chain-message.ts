import { ConditionNodeData, ConditionOperator, MessageMatch } from '../../../../types/actions'
import { VariableValue } from './action-utils'

export const matchesTopicFilter = (filter: string, topic: string) => {
  const filterLevels = filter.split('/')
  const topicLevels = topic.split('/')

  for (let index = 0; index < filterLevels.length; index++) {
    const level = filterLevels[index]

    if (level === '#') return true
    if (index >= topicLevels.length) return false
    if (level !== '+' && level !== topicLevels[index]) return false
  }

  return filterLevels.length === topicLevels.length
}

const parseJson = (message: string): unknown => {
  try {
    return JSON.parse(message)
  } catch {
    return undefined
  }
}

export const pathTokens = (path: string) =>
  Array.from(path.replace(/^\$/, '').matchAll(/\[(\d+)\]|\[["']([^"']+)["']\]|([^.[\]]+)/g)).map(
    (match) => match[1] ?? match[2] ?? match[3]
  )

export const readMessagePath = (message: string, path = ''): unknown => {
  const tokens = pathTokens(path.trim())

  if (!tokens.length) return parseJson(message) ?? message

  let current = parseJson(message)

  for (const token of tokens) {
    if (current === null || typeof current !== 'object') return undefined

    current = (current as Record<string, unknown>)[token]
  }

  return current
}

export const toVariableValue = (value: unknown): VariableValue => {
  if (value === undefined || value === null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  return JSON.stringify(value)
}

const asText = (value: unknown) =>
  typeof value === 'string' ? value : value === undefined ? '' : JSON.stringify(value)

export const messageMatches = (match: MessageMatch, message: string) => {
  switch (match.kind) {
    case 'equals':
      return message.trim() === (match.value ?? '').trim()
    case 'contains':
      return message.includes(match.value ?? '')
    case 'path': {
      const value = readMessagePath(message, match.path)

      if (!match.value) return value !== undefined

      return asText(value) === match.value
    }
    default:
      return true
  }
}

export const CONDITION_OPERATORS: { label: string; value: ConditionOperator; symbol: string }[] = [
  { label: 'Equals', value: 'equals', symbol: '=' },
  { label: 'Does not equal', value: 'not-equals', symbol: '≠' },
  { label: 'Contains', value: 'contains', symbol: '∋' },
  { label: 'Greater than', value: 'gt', symbol: '>' },
  { label: 'Less than', value: 'lt', symbol: '<' },
  { label: 'Exists', value: 'exists', symbol: '∃' }
]

export const conditionSubject = (
  condition: Partial<ConditionNodeData>,
  variables: Map<string, VariableValue>,
  lastMessage?: string
): unknown => {
  if (condition.source === 'message') {
    return lastMessage === undefined ? undefined : readMessagePath(lastMessage, condition.path)
  }

  return condition.name ? variables.get(condition.name) : undefined
}

export const evaluateCondition = (condition: Partial<ConditionNodeData>, subject: unknown) => {
  const expected = condition.value ?? ''
  const missing = subject === undefined || subject === null

  if (missing && condition.operator !== 'exists') return condition.operator === 'not-equals'

  switch (condition.operator) {
    case 'exists':
      return !missing
    case 'not-equals':
      return asText(subject) !== expected
    case 'contains':
      return asText(subject).includes(expected)
    case 'gt':
    case 'lt': {
      const left = Number(subject)
      const right = Number(expected)

      if (subject === null || subject === '' || !Number.isFinite(left) || !Number.isFinite(right)) {
        return false
      }

      return condition.operator === 'gt' ? left > right : left < right
    }
    default:
      return asText(subject) === expected
  }
}

export const describeCondition = (condition: Partial<ConditionNodeData>) => {
  const subject =
    condition.source === 'message'
      ? friendlyPath(condition.path) || 'payload'
      : condition.name || 'variable'
  const operator = CONDITION_OPERATORS.find((item) => item.value === condition.operator)

  if (condition.operator === 'exists') return `${subject} exists`

  return `${subject} ${operator?.symbol ?? '='} ${condition.value ?? ''}`.trim()
}

export const friendlyPath = (path?: string) => (path ?? '').trim().replace(/^\$\.?/, '')

export const toCanonicalPath = (text: string) => {
  const trimmed = text.trim()

  if (!trimmed) return ''
  if (trimmed.startsWith('$')) return trimmed
  if (trimmed.startsWith('[')) return `$${trimmed}`

  return `$.${trimmed}`
}

export type MessagePathOption = {
  path: string
  label: string
  value: unknown
  isContainer: boolean
}

const MAX_PATH_DEPTH = 5
const MAX_PATH_OPTIONS = 300

const keySegment = (key: string) =>
  /^[A-Za-z_$][\w$]*$/.test(key) ? `.${key}` : `["${key.replace(/"/g, '\\"')}"]`

export const listMessagePaths = (message: string): MessagePathOption[] => {
  let root: unknown

  try {
    root = JSON.parse(message)
  } catch {
    return []
  }

  const options: MessagePathOption[] = []

  const walk = (value: unknown, path: string, depth: number) => {
    if (options.length >= MAX_PATH_OPTIONS || depth > MAX_PATH_DEPTH) return
    if (value === null || typeof value !== 'object') return

    const entries = Array.isArray(value)
      ? value.map((item, index) => [`[${index}]`, item] as const)
      : Object.entries(value).map(([key, item]) => [keySegment(key), item] as const)

    for (const [segment, item] of entries) {
      const childPath = `${path}${segment}`
      const isContainer = item !== null && typeof item === 'object'

      options.push({ path: childPath, label: friendlyPath(childPath), value: item, isContainer })
      walk(item, childPath, depth + 1)
    }
  }

  walk(root, '$', 0)

  return options
}
