import { Express } from 'express'
import { ErrorMiddleware } from '../middlewares/error.middleware'
import routes from '../routes'

export const configureRoutes = (app: Express) => {
  app.use('/api/v1', routes)

  app.get('/', (_, res) => {
    res.redirect('/api/v1/system/info')
  })

  app.all(/(.*)/, (_, res) => {
    res.status(404).json({
      code: 'not-found',
      message: 'Not found'
    })
  })

  app.use(ErrorMiddleware)
}
