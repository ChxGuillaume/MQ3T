import { Router } from 'express'
import { getDeviceInfos } from '../../controllers/system.controller'

const router = Router()

router.get('/info', getDeviceInfos)

export default router
