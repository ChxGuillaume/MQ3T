import { z } from 'zod'

export const actionValidator = z.object({
  topic: z.string(),
  payload: z.string(),
  qos: z.number().refine((val) => [0, 1, 2].includes(val), {
    message: 'QoS must be one of the following values: 0, 1, 2'
  }),
  retain: z.boolean()
})

export type ActionValidator = z.infer<typeof actionValidator>
