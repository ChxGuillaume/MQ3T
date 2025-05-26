import { getComputerDetails, getComputerOs } from '../utils/getComputerDetails'
import { getCertificate } from '../utils/generateCertificate'
import { machineIdSync } from 'node-machine-id'
import bodyParser from 'body-parser'
import * as https from 'node:https'
import crypto from 'node:crypto'
import bonjour from 'bonjour'
import express from 'express'
import { app } from 'electron'
import { initRegisterRoutes } from './routes/register'

const expressApp = express()
const startPort = 55000
const maxPort = 55100
let port = startPort

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
    computerName: getComputerDetails() || 'Unknown',
    certificateFingerprint: certificate.fingerprint
  }
}

expressApp.get('/', (_, res) => {
  res.json(getDeviceInfos())
})

initRegisterRoutes(expressApp)

const tryListen = (port: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    const server = https
      .createServer(options, expressApp)
      .listen(port)
      .on('listening', () => {
        console.log('Express server listening on port ' + port)
        resolve(port)
      })
      .on('error', (err) => {
        server.close()
        reject(err)
      })
  })
}

const startServer = async () => {
  while (port <= maxPort) {
    try {
      await tryListen(port)
      break
    } catch (err) {
      port++
    }
  }

  const name = `MQ3T-${crypto.createHash('sha224').update(machineIdSync(true)).digest('hex')}`

  b.publish({
    name,
    type: 'https',
    port,
    txt: getDeviceInfos()
  })

  console.log(`Bonjour service published: ${name} on port ${port} with txt:`, getDeviceInfos())
}

void startServer()
