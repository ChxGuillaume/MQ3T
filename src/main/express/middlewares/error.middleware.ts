import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  code?: string
}

export const ErrorMiddleware = (err: AppError, _: Request, res: Response, __: NextFunction) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  const code = err.code || 'internal-error'

  console.error(`[ERROR] ${statusCode} - ${message}`)

  res.status(statusCode).json({
    code,
    message
  })
}
