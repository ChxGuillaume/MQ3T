import { MqttConnection } from '../../../../types/mqtt-connection'
import { v4 as uuidV4 } from 'uuid'

export type ConnectionForm = Required<Omit<MqttConnection, 'actionsFrom'>> &
  Pick<MqttConnection, 'actionsFrom'>

export const DEFAULT_PORTS: Record<ConnectionForm['protocol'], number> = {
  mqtt: 1883,
  mqtts: 8883,
  ws: 8083,
  wss: 8084
}

export const emptyLastWill = (): ConnectionForm['lastWill'] => ({
  topic: '',
  qos: 0,
  retain: false,
  payload: ''
})

export const createDefaultConnection = (): ConnectionForm => ({
  clientKey: `connection-${uuidV4()}`,
  name: '',
  protocol: 'mqtt',
  protocolVersion: 4,
  hostname: '',
  path: '/mqtt',
  port: 1883,
  clientId: `mq3t_${uuidV4()}`,
  username: '',
  password: '',
  subscribedTopics: [
    { topic: '$SYS/#', qos: 0 },
    { topic: '#', qos: 0 }
  ],
  connectTimeout: 30,
  reconnectPeriod: 1,
  clean: true,
  properties: {
    requestResponseInformation: false,
    requestProblemInformation: false,
    userProperties: []
  },
  lastWill: emptyLastWill(),
  labelColor: null,
  temporary: false
})
