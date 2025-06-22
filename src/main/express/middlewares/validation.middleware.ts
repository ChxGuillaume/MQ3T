import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

export const ValidationMiddleware = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          code: 'validation-error',
          message: error.errors[0].message
        })
        return
      }
      next(error)
    }
  }
}
