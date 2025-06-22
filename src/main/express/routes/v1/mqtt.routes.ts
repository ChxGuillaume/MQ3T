import { Router } from 'express'
import {
  getMqttConnectionsWithStatus,
  getMqttConnectionActions,
  getMqttConnectionTopics,
  publishMqttMessage
} from '../../controllers/mqtt.controller'
import { TokenMiddleware } from '../../middlewares/token.middleware'
import { ValidationMiddleware } from '../../middlewares/validation.middleware'
import { actionValidator } from '../../validators/action.validator'

const router = Router()

router.get('/connections', TokenMiddleware, getMqttConnectionsWithStatus)
router.get('/connections/:connectionKey/actions', TokenMiddleware, getMqttConnectionActions)
router.get('/connections/:connectionKey/topics', TokenMiddleware, getMqttConnectionTopics)
router.post(
  '/connections/:connectionKey/publish',
  [TokenMiddleware, ValidationMiddleware(actionValidator)],
  publishMqttMessage
)

export default router
