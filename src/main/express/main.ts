import { getDeviceInfo } from './controllers/system.controller'
import { getCertificate } from '../utils/generateCertificate'
import { configureRoutes } from './config/route.config'
import { bonjourName } from '../constants/bonjourName'
import bodyParser from 'body-parser'
import * as https from 'node:https'
import * as http from 'node:http'
import bonjour from 'bonjour'
import express from 'express'

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

configureRoutes(expressApp)

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
    txt: getDeviceInfo()
  })

  console.log(`Bonjour service published on port ${httpsPort}`)
}

void startServer()
