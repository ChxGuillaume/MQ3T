import { Express } from 'express'
import { TokenMiddleware } from '../middlewares/token.middleware'
import { getMqttConnections } from '../../stores/mqttConnections'
import { getAllMqttClientStatuses } from '../../stores/mqttClients'

export const initMqttRoutes = (app: Express) => {
  app.get('/mqtt/connections', TokenMiddleware, (_, res) => {
    const connections = getMqttConnections()
    const statuses = getAllMqttClientStatuses()

    const connectionsWithStatus = connections.map(connection => {
      return {
        ...connection,
        status: statuses.get(connection.clientKey) || 'disconnected'
      }
    })

    res.json(connectionsWithStatus)
  })
}
