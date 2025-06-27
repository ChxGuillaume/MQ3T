import { z } from 'zod'

export const registerSchema = z.object({
  pin: z.string().length(4, { message: "PIN must be exactly 4 characters" }),
  deviceName: z.string().min(1, { message: "Device name is required" }).max(100, { message: "Device name cannot exceed 100 characters" })
})
