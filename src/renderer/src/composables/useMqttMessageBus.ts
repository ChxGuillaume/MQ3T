export type BusMessage = {
  clientKey: string
  topic: string
  message: string
  receivedAt: number
}

type Listener = (message: BusMessage) => void

const listeners = new Set<Listener>()

export const emitMqttMessage = (message: Omit<BusMessage, 'receivedAt'>) => {
  if (!listeners.size) return

  const busMessage = { ...message, receivedAt: Date.now() }

  for (const listener of Array.from(listeners)) listener(busMessage)
}

export const onMqttMessage = (listener: Listener) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}
