import { getComputerDetails, getComputerOs } from '../utils/getComputerDetails'
import { getCertificate } from '../utils/generateCertificate'
import { initRegisterRoutes } from './routes/register'
import { initMqttRoutes } from './routes/mqtt'
import { bonjourName } from '../constants/bonjourName'
import bodyParser from 'body-parser'
import * as https from 'node:https'
import * as http from 'node:http'
import bonjour from 'bonjour'
import express from 'express'
import { app } from 'electron'

const expressApp = express()
const startPort = 55000
const maxPort = 55100

let httpsPort = startPort
let httpPort = startPort

expressApp.use(bodyParser.json())

export const b = bonjour()

const certificate = getCertificate()
const options = {
  key: certificate.keyPem,
  cert: certificate.certPem
}

const getDeviceInfos = () => {
  return {
    os: getComputerOs(),
    version: app.getVersion(),
    platform: process.platform,
    bonjourName,
    computerName: getComputerDetails() || 'Unknown',
    certificateFingerprint: certificate.fingerprint,
    certificateFingerprintSha256: `sha256/${certificate.fingerprint}`
  }
}

expressApp.get('/', (_, res) => {
  res.json(getDeviceInfos())
})

initRegisterRoutes(expressApp)
initMqttRoutes(expressApp)

const tryListen = (port: number, isHttps = false): Promise<number> => {
  return new Promise((resolve, reject) => {
    const server = isHttps ? https.createServer(options, expressApp) : http.createServer(expressApp)

    server
      .listen(port)
      .on('listening', () => {
        console.log(`Express ${isHttps ? 'HTTPS' : 'HTTP'} server listening on port ${port}`)

        resolve(port)
      })
      .on('error', (err) => {
        server.close()
        reject(err)
      })
  })
}

const startServer = async () => {
  const findAvailablePort = async (startingPort: number, isHttps = false): Promise<number> => {
    for (let port = startingPort; port <= maxPort; port++) {
      try {
        await tryListen(port, isHttps)

        return port
      } catch (err) {}
    }

    throw new Error(`No available ports found between ${startingPort} and ${maxPort}`)
  }

  httpPort = await findAvailablePort(httpPort)
  httpsPort = await findAvailablePort(httpPort + 1, true)

  b.publish({
    name: bonjourName,
    type: 'https',
    port: httpsPort,
    txt: getDeviceInfos()
  })

  console.log(`Bonjour service published on port ${httpsPort}`)
}

void startServer()
