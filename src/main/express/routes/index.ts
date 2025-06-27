import { Router } from 'express'
import authRoutes from './v1/auth.routes'
import mqttRoutes from './v1/mqtt.routes'
import systemRoutes from './v1/system.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/mqtt', mqttRoutes)
router.use('/system', systemRoutes)

export default router
