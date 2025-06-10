import { getAllMqttClientStatuses } from '../../stores/mqttClients'
import { getMqttConnections } from '../../stores/mqttConnections'
import { Request, Response } from 'express'

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
