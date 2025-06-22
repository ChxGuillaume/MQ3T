import { getDeviceInfo } from './controllers/system.controller'
import { getCertificate } from '../utils/generateCertificate'
import { configureRoutes } from './config/route.config'
import { bonjourName } from '../constants/bonjourName'
import { default as Bonjour } from 'bonjour'
import bodyParser from 'body-parser'
import * as https from 'node:https'
import { ipcMain } from 'electron'
import * as http from 'node:http'
import express from 'express'

const expressApp = express()
const startPort = 55000
const maxPort = 55100

let httpsPort = startPort
let httpPort = startPort

let httpServer: http.Server | null = null
let httpsServer: https.Server | null = null

expressApp.use(bodyParser.json())

const bonjour = Bonjour()

const certificate = getCertificate()
const options = {
  key: certificate.keyPem,
  cert: certificate.certPem
}

configureRoutes(expressApp)

const tryListen = (port: number, isHttps = false): Promise<number> => {
  return new Promise((resolve, reject) => {
    const server = isHttps ? https.createServer(options, expressApp) : http.createServer(expressApp)

    if (isHttps) httpsServer = server as https.Server
    else httpServer = server as http.Server

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

export const startServer = async () => {
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

  bonjour.publish({
    name: bonjourName,
    type: 'https',
    port: httpsPort,
    txt: getDeviceInfo()
  })

  console.log(`Bonjour service published on port ${httpsPort}`)
}

export const stopServer = async () => {
  for (const server of [httpServer, httpsServer]) {
    if (!server) continue

    await new Promise<void>((resolve) => {
      server.close(() => resolve())
    })
  }

  httpServer = null
  httpsServer = null

  bonjour.unpublishAll()

  console.log('Servers and Bonjour service stopped')
}

export const initCompanionAppServerHandlers = () => {
  ipcMain.on('start-companion-app-server', () => startServer())
  ipcMain.on('stop-companion-app-server', () => stopServer())
}
