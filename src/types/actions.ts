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

export type ConnectionsActions = Record<string, Action[]>
export type ConnectionsActionsGroups = Record<string, ActionGroup[]>
