import { Express } from 'express'

let registrationPin: string | null = null

export const initRegisterRoutes = (app: Express) => {
  app.post('/register', (req, res) => {
    console.log('Registering...', req.body, registrationPin)

    res.json(req.body.pin === registrationPin)
  })

  app.post('/register/trigger', (_, res) => {
    registrationPin = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')

    console.log('Registering request received, sending response...', registrationPin)

    res.json(registrationPin)
  })
}
