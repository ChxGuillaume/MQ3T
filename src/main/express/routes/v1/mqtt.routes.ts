import { Router } from 'express'
import { getMqttConnectionsWithStatus } from '../../controllers/mqtt.controller'
import { TokenMiddleware } from '../../middlewares/token.middleware'

const router = Router()

router.get('/connections', TokenMiddleware, getMqttConnectionsWithStatus)

export default router
