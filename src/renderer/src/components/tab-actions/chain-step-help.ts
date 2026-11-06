import { ChainActionNode, ConditionNodeData, WaitMessageNodeData } from '../../../../types/actions'
import {
  conditionSubject,
  evaluateCondition,
  matchesTopicFilter,
  messageMatches,
  readMessagePath,
  toVariableValue
} from './chain-message'
import { VariableValue } from './action-utils'
import { Edge } from '@vue-flow/core'

export type SentencePart = string | { code: string } | { placeholder: string }

export type SampleMessage = { topic: string; message: string; receivedAt: Date }

export type VariableOrigin = { name: string; origin: 'asked' | 'captured'; stepId?: string }

const formatTimeout = (data: Partial<WaitMessageNodeData>) =>
  `${data.timeout ?? 5} ${data.timeoutUnit ?? 's'}`

const OPERATOR_WORDS: Record<ConditionNodeData['operator'], string> = {
  equals: 'is',
  'not-equals': 'is not',
  contains: 'contains',
  gt: 'is greater than',
  lt: 'is less than',
  exists: 'exists'
}

const joinWithAnd = <T>(items: T[][]): T[] =>
  items.flatMap((item, index) => [
    ...(index === 0 ? [] : [index === items.length - 1 ? ' and ' : ', ']),
    ...item
  ]) as T[]

export const waitMessageSentence = (data: Partial<WaitMessageNodeData>): SentencePart[] => {
  const parts: SentencePart[] = [
    'Wait up to ',
    { code: formatTimeout(data) },
    ' for a message on ',
    data.topic ? { code: data.topic } : { placeholder: 'a topic' }
  ]
  const match = data.match ?? { kind: 'any' }

  if (match.kind === 'equals') parts.push(' whose payload is ', { code: match.value || '…' })
  if (match.kind === 'contains')
    parts.push(' whose payload contains ', { code: match.value || '…' })
  if (match.kind === 'path') {
    const field = match.path ? { code: match.path } : { placeholder: 'a field' }

    if (match.value) parts.push(' where ', field, ' is ', { code: match.value })
    else parts.push(' that has ', field)
  }

  const captures = (data.captures ?? []).filter((capture) => capture.name && capture.path)

  if (captures.length) {
    parts.push(
      ', then save ',
      ...joinWithAnd<SentencePart>(
        captures.map((capture) => [{ code: capture.path }, ' as ', { code: capture.name }])
      )
    )
  }

  parts.push('. If nothing matching arrives in time, this branch stops.')

  return parts
}

export const conditionSentence = (data: Partial<ConditionNodeData>): SentencePart[] => {
  const subject: SentencePart[] =
    data.source === 'message'
      ? data.path && data.path !== '$'
        ? ['the field ', { code: data.path }, ' of the last received message']
        : ['the last received message']
      : [data.name ? { code: data.name } : { placeholder: 'a variable' }]

  const operator = data.operator ?? 'equals'
  const comparison: SentencePart[] =
    operator === 'exists'
      ? [' exists']
      : [
          ` ${OPERATOR_WORDS[operator]} `,
          data.value ? { code: data.value } : { placeholder: 'a value' }
        ]

  return [
    'If ',
    ...subject,
    ...comparison,
    ', continue on the ',
    { code: 'true' },
    ' output, otherwise on the ',
    { code: 'false' },
    ' output.'
  ]
}

const filterLevelCovered = (subscriptionLevel: string, filterLevel: string) => {
  if (subscriptionLevel === '+') return filterLevel !== '#'

  return subscriptionLevel === filterLevel
}

export const subscriptionCovers = (subscription: string, filter: string) => {
  const subscriptionLevels = subscription.split('/')
  const filterLevels = filter.split('/')

  for (let index = 0; index < subscriptionLevels.length; index++) {
    if (subscriptionLevels[index] === '#') return true
    if (index >= filterLevels.length) return false
    if (!filterLevelCovered(subscriptionLevels[index], filterLevels[index])) return false
  }

  return subscriptionLevels.length === filterLevels.length
}

export const isTopicSubscribed = (filter: string, subscriptions: string[]) =>
  subscriptions.some((subscription) => subscriptionCovers(subscription, filter))

export const findSampleMessage = (
  data: Partial<WaitMessageNodeData>,
  topics: string[],
  lastMessageOf: (topic: string) => { message: string; createdAt: Date } | null
): SampleMessage | undefined => {
  if (!data.topic) return undefined

  const candidates = topics
    .filter((topic) => matchesTopicFilter(data.topic!, topic))
    .flatMap((topic) => {
      const last = lastMessageOf(topic)

      return last ? [{ topic, message: last.message, receivedAt: last.createdAt }] : []
    })
    .sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())

  return (
    candidates.find((candidate) =>
      messageMatches(data.match ?? { kind: 'any' }, candidate.message)
    ) ?? candidates[0]
  )
}

export const upstreamPath = (nodeId: string, edges: Edge[]) => {
  const parents = new Map(edges.map((edge) => [edge.target, edge.source]))
  const path: string[] = []
  const seen = new Set<string>()
  let current = parents.get(nodeId)

  while (current && !seen.has(current)) {
    seen.add(current)
    path.unshift(current)
    current = parents.get(current)
  }

  return path
}

export type DryRun = {
  variables: Map<string, VariableValue>
  lastMessage?: SampleMessage
  hasMessageStep: boolean
}

export const dryRunUpstream = (
  nodeId: string,
  nodes: Map<string, ChainActionNode>,
  edges: Edge[],
  sampleFor: (data: Partial<WaitMessageNodeData>) => SampleMessage | undefined
): DryRun => {
  const variables = new Map<string, VariableValue>()
  let lastMessage: SampleMessage | undefined
  let hasMessageStep = false

  for (const id of upstreamPath(nodeId, edges)) {
    const node = nodes.get(id)

    if (node?.type !== 'wait-message') continue

    hasMessageStep = true

    const sample = sampleFor(node.data ?? {})

    lastMessage = sample

    for (const capture of node.data?.captures ?? []) {
      if (!capture.name) continue
      if (sample)
        variables.set(capture.name, toVariableValue(readMessagePath(sample.message, capture.path)))
      else variables.delete(capture.name)
    }
  }

  return { variables, lastMessage, hasMessageStep }
}

export type ConditionPreview =
  | { kind: 'asked'; name: string }
  | { kind: 'unknown' }
  | { kind: 'result'; subject: unknown; result: boolean }

export const previewCondition = (
  data: Partial<ConditionNodeData>,
  dryRun: DryRun,
  origins: VariableOrigin[]
): ConditionPreview => {
  if (data.source !== 'message' && data.name) {
    const origin = origins.find((item) => item.name === data.name)

    if (origin?.origin === 'asked') return { kind: 'asked', name: data.name }
    if (!dryRun.variables.has(data.name)) return { kind: 'unknown' }
  }

  if (data.source === 'message' && !dryRun.lastMessage) return { kind: 'unknown' }

  const subject = conditionSubject(data, dryRun.variables, dryRun.lastMessage?.message)

  return { kind: 'result', subject, result: evaluateCondition(data, subject) }
}

export const stepIssues = (
  node: ChainActionNode,
  context: {
    edges: Edge[]
    nodes: Map<string, ChainActionNode>
    origins: VariableOrigin[]
    subscriptions: string[]
    actionMissing?: boolean
  }
): string[] => {
  const issues: string[] = []

  switch (node.type) {
    case 'action':
      if (context.actionMissing) issues.push('The linked action was deleted')
      else if (!node.data?.action) issues.push('Set up the message this step sends')
      break
    case 'wait-message': {
      const data: Partial<WaitMessageNodeData> = node.data ?? {}

      if (!data.topic) issues.push('Choose a topic to listen on')
      else if (!isTopicSubscribed(data.topic, context.subscriptions)) {
        issues.push(`Not subscribed to ${data.topic}, so its messages never arrive`)
      }
      if (data.match?.kind === 'path' && !data.match.path) issues.push('Enter the field to match')
      if ((data.captures ?? []).some((capture) => !capture.name || !capture.path)) {
        issues.push('Give every saved value a name and a field')
      }
      break
    }
    case 'condition': {
      const data: Partial<ConditionNodeData> = node.data ?? {}
      const upstream = upstreamPath(node.id, context.edges)

      if (data.source === 'message') {
        const hasMessageStep = upstream.some((id) => context.nodes.get(id)?.type === 'wait-message')

        if (!hasMessageStep) issues.push('Add a Wait for message step before this condition')
      } else if (!data.name) {
        issues.push('Choose the variable to check')
      } else if (!context.origins.some((origin) => origin.name === data.name)) {
        issues.push(`No step provides “${data.name}”`)
      }
      if (!context.edges.some((edge) => edge.source === node.id)) {
        issues.push('Connect the true or false output to a step')
      }
      break
    }
  }

  return issues
}
