import { Edge, Node } from '@vue-flow/core'

type ConnectionId = string
type GroupId = string

export type Action = {
  id: string
  groupId: string | 'default'
  name: string
  description?: string
  topic: string
  qos: 0 | 1 | 2
  payload: string
  retained: boolean
  payloadFormat?: 'raw' | 'json' | 'xml' | 'yaml'
  enumOptions?: Record<string, (string | number)[]>
  responseTopic?: string
  correlationData?: string
}

type Empty = Record<string, never>

export type StartNode = Node<Empty, Empty, 'start'>

export type ActionNodeData = { action?: Action; actionId?: string; topicOverride?: string }
export type ActionNode = Node<ActionNodeData, Empty, 'action'>

export type WaitNodeData = { duration: number; durationType: 'ms' | 's' }
export type WaitNode = Node<WaitNodeData, Empty, 'wait'>

export type MessageMatch = {
  kind: 'any' | 'equals' | 'contains' | 'path'
  path?: string
  value?: string
}

export type MessageCapture = { name: string; path: string }

export type WaitMessageNodeData = {
  topic: string
  timeout: number
  timeoutUnit: 'ms' | 's'
  match: MessageMatch
  captures: MessageCapture[]
}
export type WaitMessageNode = Node<WaitMessageNodeData, Empty, 'wait-message'>

export type ConditionOperator = 'equals' | 'not-equals' | 'contains' | 'gt' | 'lt' | 'exists'

export type ConditionNodeData = {
  source: 'variable' | 'message'
  name?: string
  path?: string
  operator: ConditionOperator
  value?: string
}
export type ConditionNode = Node<ConditionNodeData, Empty, 'condition'>

export type ChainActionNode = StartNode | ActionNode | WaitNode | WaitMessageNode | ConditionNode

export type ChainRepeat = {
  count: number
  interval: number
  intervalUnit: 'ms' | 's'
}

export type ChainAction = {
  id: string
  groupId: string | 'default'
  name: string
  nodes: ChainActionNode[]
  edges: Edge[]
  repeat?: ChainRepeat
}

export type ActionGroup = {
  id: GroupId
  name: string
  description?: string
  sharedWith?: ConnectionId[]
}

export type ConnectionsActions = Record<ConnectionId, Record<GroupId, Action[]>>
export type ConnectionsChainActions = Record<ConnectionId, Record<GroupId, ChainAction[]>>
export type ConnectionsActionsGroups = Record<ConnectionId, ActionGroup[]>

export type ConnectionsActionsFileV1 = { type: 'v1'; actions: Record<string, Action[]> }
export type ConnectionsActionsFileV2 = {
  type: 'v2'
  actions: Record<ConnectionId, Record<GroupId, Action[]>>
}

export type ConnectionsActionsFile = ConnectionsActionsFileV1 | ConnectionsActionsFileV2

export type ExportChainActionsFileV1 = {
  version: 1
  type: 'chain-actions'
  chainActions: ChainAction[]
}

export type ExportChainActionsFile = ExportChainActionsFileV1

export type ExportActionsFileV1 = {
  version: 1
  type: 'actions'
  actions: Action[]
}

export type ExportActionsFile = ExportActionsFileV1

export type ExportGroupsFileV1 = {
  version: 1
  type: 'groups'
  groups: ActionGroup[]
  actions: Record<string, Action[]>
  chainActions: Record<string, ChainAction[]>
}

export type ExportGroupsFile = ExportGroupsFileV1
