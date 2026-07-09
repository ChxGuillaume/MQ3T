const hostname = process.argv[2]

const mqttClient = require('mqtt').connect(`mqtt://${hostname}`)

const publishRandomMessage = (topic, timeout) => {
  const nextData = parseFloat((Math.random() * 100).toFixed(2))

  mqttClient.publish(topic, JSON.stringify(nextData))

  setTimeout(() => publishRandomMessage(topic, Math.random() * 3000 + 500), timeout)
}

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker')
  const dataForGraph = [10, 12, 16, 12, 14, 20, 18, 14, 12, 10]

  setInterval(() => {
    const nextData = dataForGraph.shift()

    if (!nextData) return

    mqttClient.publish('MQ3T/humidity', JSON.stringify(nextData))
  }, 1000)

  publishRandomMessage('MQ3T/pressure', 3000)
  publishRandomMessage('MQ3T/acceleration', 1000)
  publishRandomMessage('MQ3T/linear-acceleration', 1000)

  let telemetryCount = 0
  const publishDeviceTelemetry = () => {
    if (telemetryCount >= 30) return
    telemetryCount++
    const telemetry = {
      environment: {
        temperature: parseFloat((20 + Math.random() * 10).toFixed(1)),
        humidity: parseFloat((40 + Math.random() * 40).toFixed(1)),
        pressure: parseFloat((990 + Math.random() * 30).toFixed(2)),
        co2: Math.floor(400 + Math.random() * 600)
      },
      power: {
        batteryLevel: Math.floor(Math.random() * 100),
        charging: Math.random() > 0.5,
        voltage: parseFloat((3.2 + Math.random()).toFixed(2)),
        currentDraw: parseFloat((0.1 + Math.random() * 0.9).toFixed(3))
      },
      network: {
        signalStrength: Math.floor(-90 + Math.random() * 60),
        ssid: 'IoT-Network',
        packetLoss: parseFloat((Math.random() * 5).toFixed(2)),
        latency: Math.floor(1 + Math.random() * 50)
      },
      system: {
        cpuUsage: parseFloat((Math.random() * 100).toFixed(1)),
        memoryUsed: Math.floor(128 + Math.random() * 384),
        memoryTotal: 512,
        uptime: Math.floor(Math.random() * 86400),
        errorCount: Math.floor(Math.random() * 5),
        firmwareVersion: '2.4.1'
      },
      sensors: [
        {
          id: 'sen-01',
          type: 'temperature',
          value: parseFloat((20 + Math.random() * 10).toFixed(1)),
          unit: '°C',
          healthy: true
        },
        {
          id: 'sen-02',
          type: 'humidity',
          value: parseFloat((40 + Math.random() * 40).toFixed(1)),
          unit: '%',
          healthy: true
        },
        {
          id: 'sen-03',
          type: 'pressure',
          value: parseFloat((990 + Math.random() * 30).toFixed(2)),
          unit: 'hPa',
          healthy: Math.random() > 0.1
        },
        {
          id: 'sen-04',
          type: 'light',
          value: Math.floor(Math.random() * 1000),
          unit: 'lux',
          healthy: Math.random() > 0.1
        },
        {
          id: 'sen-05',
          type: 'motion',
          value: Math.random() > 0.7 ? 1 : 0,
          unit: 'bool',
          healthy: true
        }
      ]
    }
    mqttClient.publish('MQ3T/device/telemetry', JSON.stringify(telemetry))
    setTimeout(publishDeviceTelemetry, 100 + Math.random() * 50)
  }

  publishDeviceTelemetry()

  mqttClient.publish(
    'MQ3T/information',
    JSON.stringify({
      name: 'MQ3T',
      version: '1.0.0',
      description: 'MQ3T sensor data',
      amountOfSensors: 4,
      sensors: ['humidity', 'pressure', 'acceleration', 'linear-acceleration'],
      active: true
    })
  )
  mqttClient.publish('MQ3T/network/connected', JSON.stringify('online'))
  mqttClient.publish('MQ3T/network/ip', JSON.stringify('192.168.1.1'))
  mqttClient.publish('MQ3T/network/mac', JSON.stringify('00:11:22:33:44:55'))
})
