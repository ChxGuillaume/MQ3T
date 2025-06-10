import Joi from 'joi'

export const registerSchema = Joi.object({
  pin: Joi.string().required().length(4),
  deviceName: Joi.string().required().min(1).max(100)
})
