import { IClientPublishOptions, OnMessageCallback } from 'mqtt/src/lib/client'
import { MqttConnection } from '../types/mqtt-connection'
import mqtt, { IClientOptions } from 'mqtt'

const valueOrUndefined = <T>(value: T | undefined) => {
  if (!value) return undefined

  return value
}

export class MqttClient {
  private client: mqtt.MqttClient
  private latencyCallbacks: Array<(latency: number) => void> = []

  constructor(connection: MqttConnection) {
    const connectionOptions: mqtt.IClientOptions = {
      clientId: connection.clientId,
      password: connection.password,
      username: connection.username,
      protocolVersion: connection.protocolVersion,
      connectTimeout: (connection.connectTimeout || 30) * 1000,
      reconnectPeriod: (connection.reconnectPeriod || 1) * 1000,
      clean: connection.clean
    }

    if (connection.protocolVersion === 5 && connection.properties) {
      const properties: IClientOptions['properties'] = {
        requestResponseInformation: connection.properties.requestResponseInformation,
        requestProblemInformation: connection.properties.requestProblemInformation
      }

      const sessionExpiryInterval = valueOrUndefined(connection.properties.sessionExpiryInterval)
      const receiveMaximum = valueOrUndefined(connection.properties.receiveMaximum)
      const maximumPacketSize = valueOrUndefined(connection.properties.maximumPacketSize)

      if (sessionExpiryInterval) properties.sessionExpiryInterval = sessionExpiryInterval
      else if (!connection.clean) properties.sessionExpiryInterval = 4_294_967_295

      if (receiveMaximum) properties.receiveMaximum = receiveMaximum
      if (maximumPacketSize) properties.maximumPacketSize = maximumPacketSize

      if (connection.properties.userProperties.length) {
        properties.userProperties = Object.fromEntries(
          connection.properties.userProperties.map(({ key, value }) => [key, value])
        )
      }

      connectionOptions.properties = properties
    }

    if (connection.lastWill && connection.lastWill.topic) {
      connectionOptions.will = {
        topic: connection.lastWill.topic,
        qos: connection.lastWill.qos,
        retain: connection.lastWill.retain,
        payload: Buffer.from(connection.lastWill.payload)
      }
    }

    const path = ['mqtt', 'mqtts'].includes(connection.protocol) ? '' : connection.path || ''

    this.client = mqtt.connect(
      `${connection.protocol}://${connection.hostname}:${connection.port}${path}`,
      connectionOptions
    )

    let pingStartTime: number

    setInterval(() => {
      pingStartTime = Date.now()
      this.client.sendPing()
    }, 1000 * 5)

    this.client.on('packetreceive', (packet) => {
      if (packet.cmd !== 'pingresp') return

      for (const cb of this.latencyCallbacks) {
        try {
          cb(Date.now() - pingStartTime)
        } catch {
          /* empty */
        }
      }
    })
  }

  public onError(callback: (error: Error) => void) {
    this.client.on('error', callback)
  }

  public onConnect(callback: () => void) {
    this.client.on('connect', callback)
  }

  public onReconnect(callback: () => void) {
    this.client.on('reconnect', callback)
  }

  public onLatency(callback: (latency: number) => void) {
    this.latencyCallbacks.push(callback)
  }

  public onMessage(callback: OnMessageCallback) {
    this.client.on('message', callback)
  }

  public onDisconnect(callback: () => void) {
    this.client.on('close', callback)
  }

  public subscribe(topic: string, extras?: mqtt.IClientSubscribeOptions) {
    this.client.subscribe(topic, extras)
  }

  public publish(topic: string, message: string, options?: IClientPublishOptions) {
    this.client.publish(topic, message, options)
  }

  public disconnect() {
    this.client.end()
  }
}
