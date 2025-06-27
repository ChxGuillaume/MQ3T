import { Router } from 'express'
import {
  register,
  triggerRegistration,
  cancelRegistration,
  getMe
} from '../../controllers/auth.controller'
import { TokenMiddleware } from '../../middlewares/token.middleware'
import { ValidationMiddleware } from '../../middlewares/validation.middleware'
import { registerSchema } from '../../validators/auth.validator'

const router = Router()

router.post('/register', ValidationMiddleware(registerSchema), register)
router.post('/register/trigger', triggerRegistration)
router.post('/register/cancel', cancelRegistration)

router.get('/me', TokenMiddleware, getMe)

export default router
