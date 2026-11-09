import { MessageMatch } from '../../../../types/actions'
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
