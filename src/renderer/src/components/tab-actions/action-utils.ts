import { actionsVariables, getPayloadVariablesGrouped } from '@renderer/assets/js/actions-variables'
import { slicedWildcardMatchesTopics } from '@renderer/assets/js/topic-matcher'
import { Action, ActionGroup, ChainAction } from '../../../../types/actions'
import { v4 as uuidV4 } from 'uuid'

export type PayloadFormat = NonNullable<Action['payloadFormat']>

export const DEFAULT_GROUP: ActionGroup = { id: 'default', name: 'Default' }

const FORMAT_TILES: Record<PayloadFormat, { glyph: string; class: string }> = {
  json: { glyph: '{}', class: 'text-primary' },
  raw: { glyph: '""', class: 'text-code-str' },
  xml: { glyph: '<>', class: 'text-code-sym' },
  yaml: { glyph: '-:', class: 'text-code-num' }
}

export const formatTile = (format?: Action['payloadFormat']) => FORMAT_TILES[format || 'raw']

export const isWildcardTopic = (topic: string) => topic.includes('+')

export const topicParts = (topic: string) =>
  topic
    .split(/(\+)/)
    .filter(Boolean)
    .map((text) => ({ text, wildcard: text === '+' }))

export const wildcardTargets = (wildcard: string, topics: string[]) =>
  slicedWildcardMatchesTopics(wildcard, topics).sort()

export const highlightFilledTopic = (wildcard: string, topic: string) => {
  const wildcardParts = wildcard.split('/')

  return topic.split('/').map((text, index) => ({
    text,
    filled: wildcardParts[index] === '+',
    separator: index > 0
  }))
}

export type TopicRuleOptions = { noWildcard?: boolean }

export const validateTopic = (topic: string, options: TopicRuleOptions = {}) => {
  if (!topic) return 'Topic is required'
  if (topic.includes('#')) return 'Topic cannot include #'
  if (topic.endsWith('+')) return 'Topic cannot end with +'
  if (options.noWildcard && topic.includes('+')) return 'Topic cannot include +'

  return undefined
}

export type VariableValue = string | number | boolean | null

export type VariableField = {
  key: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'enum'
  options: (string | number)[]
}

type VariableSource = Pick<Action, 'payload' | 'payloadFormat' | 'enumOptions'>

export const variableFields = (action: VariableSource): VariableField[] =>
  getPayloadVariablesGrouped(action.payload).flatMap((group) =>
    group.variables.map((variable, index) => ({
      key: `${index}:${variable.full}`,
      name: variable.name,
      type: group.type as VariableField['type'],
      options: action.enumOptions?.[variable.name] || []
    }))
  )

export const defaultVariableValues = (action: VariableSource) => {
  const values: Record<string, VariableValue> = {}

  for (const field of variableFields(action)) {
    switch (field.type) {
      case 'string':
        values[field.key] = ''
        break
      case 'number':
        values[field.key] = 0
        break
      case 'boolean':
        values[field.key] = false
        break
      case 'enum':
        values[field.key] = field.options[0] !== undefined ? field.options[0] : ''
        break
    }
  }

  return values
}

export const hasGeneratedUuid = (payload: string) =>
  new RegExp(actionsVariables.uuidV4.regex.source).test(payload)

export const applyVariables = (
  action: VariableSource,
  values: Record<string, VariableValue>,
  uuid: string = uuidV4()
) => {
  const isJson = action.payloadFormat === 'json'

  const keys = Object.keys(values)
    .map((key) => ({
      key,
      index: parseInt(key.split(':')[0]),
      variable: key.slice(key.indexOf(':') + 1)
    }))
    .sort((a, b) => a.index - b.index)

  let result = action.payload

  for (const { key, variable } of keys) {
    const value = isJson ? JSON.stringify(values[key]) : String(values[key])

    result = result.replace(variable, () => value)
  }

  const uuidValue = isJson ? JSON.stringify(uuid) : uuid

  return result.replace(actionsVariables.uuidV4.regex, () => uuidValue)
}

const VARIABLE_TOKENS: Record<VariableField['type'], string> = {
  string: 's',
  number: 'n',
  boolean: 'b',
  enum: 'enum'
}

export type NamedVariableValues = Record<string, VariableValue>

export const mergedVariableSource = (
  sources: VariableSource[],
  excludedNames: Set<string> = new Set()
): VariableSource => {
  const types = new Map<string, VariableField['type']>()
  const enumOptions: Record<string, (string | number)[]> = {}

  for (const source of sources) {
    for (const field of variableFields(source)) {
      if (excludedNames.has(field.name) || types.has(field.name)) continue

      types.set(field.name, field.type)

      if (field.type === 'enum') enumOptions[field.name] = field.options
    }
  }

  return {
    payload: Array.from(types)
      .map(([name, type]) => `$${VARIABLE_TOKENS[type]}$${name}$`)
      .join('\n'),
    payloadFormat: 'raw',
    enumOptions
  }
}

export const namedVariableValues = (
  source: VariableSource,
  values: Record<string, VariableValue>
): NamedVariableValues =>
  Object.fromEntries(variableFields(source).map((field) => [field.name, values[field.key]]))

export const keyedVariableValues = (
  source: VariableSource,
  named: Map<string, VariableValue>
): Record<string, VariableValue> => {
  const defaults = defaultVariableValues(source)

  return Object.fromEntries(
    variableFields(source).map((field) => [
      field.key,
      named.has(field.name) ? named.get(field.name)! : defaults[field.key]
    ])
  )
}

export const resolveActionVariables = (
  action: Action,
  named: Map<string, VariableValue>
): Pick<Action, 'topic' | 'payload'> => {
  const topicSource = { payload: action.topic, payloadFormat: 'raw' as const }

  return {
    topic: applyVariables(topicSource, keyedVariableValues(topicSource, named)),
    payload: applyVariables(action, keyedVariableValues(action, named))
  }
}

export const chainSteps = (chainAction: Pick<ChainAction, 'nodes' | 'edges'>) => {
  const order: string[] = []
  const queue = ['start']
  const seen = new Set<string>()

  while (queue.length) {
    const id = queue.shift()!

    if (seen.has(id)) continue
    seen.add(id)
    order.push(id)

    for (const edge of chainAction.edges) {
      if (edge.source === id) queue.push(edge.target)
    }
  }

  const nodes = new Map(chainAction.nodes.map((node) => [node.id, node]))

  return order.map((id) => nodes.get(id)).filter((node) => !!node)
}

export const chainStepLabel = (node: ChainAction['nodes'][number]) => {
  switch (node.type) {
    case 'start':
      return 'start'
    case 'wait':
      return `wait ${node.data?.duration || 0} ${node.data?.durationType || 'ms'}`
    case 'action':
      return node.data?.action?.name || node.data?.action?.topic || 'Action'
    default:
      return ''
  }
}

const waitDurationMs = (node: ChainAction['nodes'][number]) => {
  if (node.type !== 'wait') return 0

  const duration = node.data?.duration || 500

  return node.data?.durationType === 's' ? duration * 1000 : duration
}

export const formatChainDuration = (ms: number) => {
  if (ms < 1000) return `${ms} ms`

  const seconds = ms / 1000

  if (seconds < 60) return `${Number(seconds.toFixed(1))} s`

  const minutes = Math.floor(seconds / 60)
  const rest = Math.round(seconds % 60)

  return rest ? `${minutes} min ${rest} s` : `${minutes} min`
}

export const chainSummary = (chainAction: Pick<ChainAction, 'nodes' | 'edges'>) => {
  const reachable = chainSteps(chainAction)
  const reachableIds = new Set(reachable.map((node) => node.id))
  const nodes = new Map(chainAction.nodes.map((node) => [node.id, node]))

  const longestFrom = new Map<string, number>()
  const visiting = new Set<string>()

  const longestDuration = (id: string): number => {
    if (longestFrom.has(id)) return longestFrom.get(id)!
    if (visiting.has(id)) return 0

    visiting.add(id)

    const node = nodes.get(id)
    const own = node ? waitDurationMs(node) : 0
    const next = chainAction.edges
      .filter((edge) => edge.source === id)
      .reduce((max, edge) => Math.max(max, longestDuration(edge.target)), 0)

    visiting.delete(id)
    longestFrom.set(id, own + next)

    return own + next
  }

  const actions = reachable.flatMap((node) => (node.type === 'action' ? [node] : []))

  return {
    actionCount: actions.length,
    waitCount: reachable.filter((node) => node.type === 'wait').length,
    topicCount: new Set(actions.map((node) => node.data?.action?.topic).filter(Boolean)).size,
    durationMs: longestDuration('start'),
    hasBranches: reachable.some(
      (node) => chainAction.edges.filter((edge) => edge.source === node.id).length > 1
    ),
    unlinkedCount: chainAction.nodes.filter((node) => !reachableIds.has(node.id)).length
  }
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const highlightPayload = (payload: string, format?: Action['payloadFormat']) => {
  const escaped = escapeHtml(payload)

  if (format !== 'json') return escaped

  return escaped.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, str, colon, keyword, num) => {
      if (str && colon) return `<span class="text-code-key">${str}</span>${colon}`
      if (str) return `<span class="text-code-str">${str}</span>`
      if (keyword) return `<span class="text-code-sym">${keyword}</span>`
      if (num) return `<span class="text-code-num">${num}</span>`

      return match
    }
  )
}

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
