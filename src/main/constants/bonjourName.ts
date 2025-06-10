import crypto from 'node:crypto'
import { machineIdSync } from 'node-machine-id'

export const bonjourName = `MQ3T-${crypto.createHash('sha224').update(machineIdSync(true)).digest('hex')}`
