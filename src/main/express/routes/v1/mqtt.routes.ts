import { Router } from 'express'
import {
  getMqttConnectionsWithStatus,
  getMqttConnectionActions,
  getMqttConnectionTopics
} from '../../controllers/mqtt.controller'
import { TokenMiddleware } from '../../middlewares/token.middleware'

const router = Router()

router.get('/connections', TokenMiddleware, getMqttConnectionsWithStatus)
router.get('/connections/:connectionKey/actions', TokenMiddleware, getMqttConnectionActions)
router.get('/connections/:connectionKey/topics', TokenMiddleware, getMqttConnectionTopics)

export default router
