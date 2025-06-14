import { getAllMqttClientStatuses, getAllMqttClientTopics } from '../../stores/mqttClients'
import { getMqttConnections } from '../../stores/mqttConnections'
import { getActions } from '../../stores/actions'
import { getActionsGroups } from '../../stores/actionsGroups'
import { Request, Response } from 'express'
import { ActionGroup } from '../../../types/actions'

export const getMqttConnectionsWithStatus = (_: Request, res: Response) => {
  const connections = getMqttConnections()
  const statuses = getAllMqttClientStatuses()

  const connectionsWithStatus = connections.map((connection) => {
    return {
      ...connection,
      status: statuses.get(connection.clientKey) || 'disconnected'
    }
  })

  res.json(connectionsWithStatus)
}

export const getMqttConnectionActions = (request: Request, res: Response) => {
  const connectionKey = request.params['connectionKey']
  const connectionActions = getActions()?.actions?.[connectionKey] || {}
  const connectionGroups: ActionGroup[] = getActionsGroups()?.[connectionKey] || []

  const groups = Object.entries(connectionActions).map(([groupId, actions]) => {
    const groupInfo = connectionGroups.find((group) => group.id === groupId) || { id: groupId }

    return {
      name: 'Default',
      ...groupInfo,
      actions: actions
    }
  })

  res.json({ groups })
}

const wildcardMatchesTopics = (wildcard: string, topics: string[]): string[] => {
  let regexTopic = wildcard.replace(/\+/g, '.+?').replace(/\//g, '\\/')

  return topics.filter((topic) => new RegExp(regexTopic).test(topic))
}

export const getMqttConnectionTopics = (request: Request, res: Response) => {
  const connectionKey = request.params['connectionKey']
  const match = request.query['match'] as string | undefined

  const topics = getAllMqttClientTopics(connectionKey)

  res.json({
    topics: match ? wildcardMatchesTopics(match, topics) : topics
  })
}
