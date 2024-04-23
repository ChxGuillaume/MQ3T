const hostname = process.argv[2]
const topic = process.argv[3]

const mqttClient = require('mqtt').connect(`mqtt://${hostname}`)

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker')

  setInterval(() => {
    mqttClient.publish(
      topic || 'test/graph-data',
      JSON.stringify({
        data: [
          {
            name: 'A',
            value: parseFloat((Math.random() * 100).toFixed(2)),
            temperature: parseFloat((Math.random() * 100).toFixed(2))
          },
          {
            name: 'B',
            value: parseFloat((Math.random() * 100).toFixed(2)),
            power: parseFloat((Math.random() * 100).toFixed(2))
          },
          {
            name: 'C',
            value: parseFloat((Math.random() * 100).toFixed(2)),
            voltage: parseFloat((Math.random() * 100).toFixed(2))
          }
        ]
      })
    )
  }, 2000)
})
