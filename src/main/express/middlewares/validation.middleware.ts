import { Request, Response, NextFunction } from 'express'
import { Schema } from 'joi'

export const ValidationMiddleware = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body)

    if (error) {
      res.status(400).json({
        code: 'validation-error',
        message: error.details[0].message
      })

      return
    }

    next()
  }
}
