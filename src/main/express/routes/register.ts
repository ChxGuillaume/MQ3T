import { Express } from 'express'
import { EventEmitter } from 'events'

let registrationPin: string | null = null

// Create an event emitter for registration events
export const registerEvents = new EventEmitter()

export const initRegisterRoutes = (app: Express) => {
  app.post('/register', (req, res) => {
    const isValid = req.body.pin === registrationPin

    if (isValid) {
      registerEvents.emit('registration-completed')
      registrationPin = null
    }

    res.json(isValid)
  })

  app.post('/register/trigger', (_, res) => {
    registrationPin = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')

    registerEvents.emit('registration-triggered', registrationPin)

    res.json(registrationPin)
  })

  app.post('/register/cancel', (_, res) => {
    if (registrationPin) {
      registrationPin = null
      registerEvents.emit('registration-canceled')
    }

    res.json({ success: true })
  })
}
