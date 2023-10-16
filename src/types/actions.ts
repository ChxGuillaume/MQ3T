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
  description?: string
}

export type ConnectionsActions = Record<string, Record<string, Action[]>>
export type ConnectionsActionsGroups = Record<string, ActionGroup[]>

export type ConnectionsActionsFileV1 = { type: 'v1'; actions: Record<string, Action[]> }
export type ConnectionsActionsFileV2 = {
  type: 'v2'
  actions: Record<string, Record<string, Action[]>>
}

export type ConnectionsActionsFile = ConnectionsActionsFileV1 | ConnectionsActionsFileV2

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
}

export type ExportGroupsFile = ExportGroupsFileV1
