import {
  Action,
  ConnectionsActionsFileV1,
  ConnectionsActionsFileV2
} from '../../../../types/actions'

export const convertActionsFileV1toV2 = (
  file: ConnectionsActionsFileV1
): ConnectionsActionsFileV2 => {
  const connections = file.actions

  const actionsV2: ConnectionsActionsFileV2 = {
    type: 'v2',
    actions: {}
  }

  for (const connectionId in connections) {
    actionsV2.actions[connectionId] = connections[connectionId].reduce(
      (acc, action) => {
        if (!acc[action.groupId]) acc[action.groupId] = []

        acc[action.groupId].push(action)

        return acc
      },
      {} as Record<string, Action[]>
    )
  }

  return actionsV2
}
