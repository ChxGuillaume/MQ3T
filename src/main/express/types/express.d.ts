import { Express } from 'express-serve-static-core'

declare global {
  namespace Express {
    interface Request {
      user?: {
        deviceName: string
      }
    }
  }
}
