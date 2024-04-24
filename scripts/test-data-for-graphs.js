const hostname = process.argv[2]
const topic1 = process.argv[3]
const topic2 = process.argv[4]

const mqttClient = require('mqtt').connect(`mqtt://${hostname}`)

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker')

  setInterval(() => {
    mqttClient.publish(
      topic1 || 'test/graph-data',
      JSON.stringify({
        data: [
          {
            name: 'A',
            value: parseFloat((Math.random() * 100).toFixed(2)),
            temperature: parseFloat((Math.random() * 100).toFixed(2))
          },
          {
            name: 'B',
            value: parseFloat((Math.random() * 100000).toFixed(2)),
            power: parseFloat((Math.random() * 100000).toFixed(2))
          },
          {
            name: 'C',
            value: parseFloat((Math.random() * 100000000).toFixed(2)),
            voltage: parseFloat((Math.random() * 100000000).toFixed(2))
          },
          {
            name: 'D',
            value: parseFloat((Math.random() * 100000000000).toFixed(2)),
            voltage: parseFloat((Math.random() * 100000000000).toFixed(2))
          },
          {
            name: 'E',
            value: parseFloat((Math.random() * 100000000000000).toFixed(2)),
            voltage: parseFloat((Math.random() * 100000000000000).toFixed(2))
          }
        ]
      })
    )

    mqttClient.publish(
      topic2 || 'test/graph-simple-data',
      JSON.stringify(parseFloat((Math.random() * 100).toFixed(2)))
    )
  }, 2000)
})
