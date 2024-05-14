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
