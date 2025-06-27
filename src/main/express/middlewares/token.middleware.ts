import { Request, Response, NextFunction } from 'express'
import { findToken } from '../../stores/authToken'

export interface AuthenticatedRequest extends Request {
  user?: any
}

export const TokenMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      res.status(401).json({ message: 'No token provided' })
      return
    }

    if (!authHeader.startsWith('Token ')) {
      res.status(401).json({ message: 'Invalid token format' })
      return
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      res.status(401).json({ message: 'Invalid token' })
      return
    }

    const storedToken = await findToken(token)

    if (!storedToken) {
      res.status(401).json({ message: 'Invalid token' })
      return
    }

    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
    return
  }
}
