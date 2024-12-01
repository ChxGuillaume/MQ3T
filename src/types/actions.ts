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
  payloadFormat?: 'raw' | 'json' | 'xml'
}

export type StartNode = Node<{}, {}, 'start'>

export type ActionNodeData = { action: Action }
export type ActionNode = Node<ActionNodeData, {}, 'action'>

export type WaitNodeData = { duration: number; durationType: 'ms' | 's' }
export type WaitNode = Node<WaitNodeData, {}, 'wait'>

export type ChainActionNode = StartNode | ActionNode | WaitNode

export type ChainAction = {
  id: string
  groupId: string | 'default'
  name: string
  nodes: ChainActionNode[]
  edges: Edge[]
}

export type ActionGroup = {
  id: GroupId
  name: string
  description?: string
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
