import { IPublishPacket } from 'mqtt'

export type MqttMessage = {
  uid: string
  qos: 0 | 1 | 2
  message: string
  dataType?: 'raw' | 'json' | 'xml' | 'yaml'
  retained: boolean
  createdDiff?: number
  createdAt: Date

  properties?: IPublishPacket['properties']
}

export type MqttTopicStructure = {
  [key: string]: MqttTopicStructure | null
}

export type TopicMessages = Record<string, Record<string, MqttMessage[]>>
