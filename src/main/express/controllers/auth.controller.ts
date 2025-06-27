import { createToken } from '../../stores/authToken'
import { Request, Response } from 'express'
import { EventEmitter } from 'events'

let registrationPin: string | null = null

export const registerEvents = new EventEmitter()

export const register = async (req: Request, res: Response) => {
  const isValid = req.body.pin === registrationPin

  if (!isValid) {
    res.status(400).json({
      code: 'invalid-pin',
      message: 'Invalid PIN'
    })

    return
  }

  registerEvents.emit('registration-completed')
  registrationPin = null

  const token = await createToken({ deviceName: req.body.deviceName })

  res.json({ token })
}

export const triggerRegistration = (_: Request, res: Response) => {
  registrationPin = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')

  registerEvents.emit('registration-triggered', registrationPin)

  res.json({ success: true })
}

export const cancelRegistration = (_: Request, res: Response) => {
  if (registrationPin) {
    registrationPin = null
    registerEvents.emit('registration-canceled')
  }

  res.json({ success: true })
}

export const getMe = (_: Request, res: Response) => {
  res.json({ name: 'You' })
}
