import { EventEmitter } from 'events'
import { Express } from 'express'
import { createToken } from '../../stores/authToken'
import { TokenMiddleware } from '../middlewares/token.middleware'

let registrationPin: string | null = null

export const registerEvents = new EventEmitter()

export const initRegisterRoutes = (app: Express) => {
  app.post('/register', async (req, res) => {
    const isValid = req.body.pin === registrationPin

    if (!isValid) {
      res.status(401).json({
        code: 'invalid-pin',
        message: 'Invalid PIN'
      })

      return
    }

    registerEvents.emit('registration-completed')
    registrationPin = null

    const token = await createToken({ deviceName: req.body.deviceName })

    res.json({ token })
  })

  app.post('/register/trigger', (_, res) => {
    registrationPin = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')

    registerEvents.emit('registration-triggered', registrationPin)

    res.json({ success: true })
  })

  app.post('/register/cancel', (_, res) => {
    if (registrationPin) {
      registrationPin = null
      registerEvents.emit('registration-canceled')
    }

    res.json({ success: true })
  })

  app.get('/me', TokenMiddleware, (_, res) => {
    res.json({ name: 'You' })
  })
}
