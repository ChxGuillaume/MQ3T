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

const pathTokens = (path: string) =>
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

  switch (condition.operator) {
    case 'exists':
      return subject !== undefined && subject !== null
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
    condition.source === 'message' ? condition.path || '$' : condition.name || 'variable'
  const operator = CONDITION_OPERATORS.find((item) => item.value === condition.operator)

  if (condition.operator === 'exists') return `${subject} exists`

  return `${subject} ${operator?.symbol ?? '='} ${condition.value ?? ''}`.trim()
}
