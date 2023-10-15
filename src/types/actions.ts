export type Action = {
  id: string
  groupId: string | 'default'
  name: string
  description: string
  topic: string
  qos: 0 | 1 | 2
  payload: string
  retained: boolean
  payloadFormat?: 'raw' | 'json' | 'xml'
}

export type ActionGroup = {
  id: string
  name: string
  description: string
}

export type ConnectionsActions = Record<string, Record<string, Action[]>>
export type ConnectionsActionsGroups = Record<string, ActionGroup[]>

export type ConnectionsActionsFileV1 = { type: 'v1'; actions: Record<string, Action[]> }
export type ConnectionsActionsFileV2 = {
  type: 'v2'
  actions: Record<string, Record<string, Action[]>>
}

export type ConnectionsActionsFile = ConnectionsActionsFileV1 | ConnectionsActionsFileV2
