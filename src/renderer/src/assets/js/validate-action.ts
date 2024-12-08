import { Action } from '../../../../types/actions'

export const validateAction = (action: Action): boolean => {
  if (!action) return false
  if (typeof action !== 'object') return false

  const { id, groupId, name, description, topic, qos, payload, retained } = action

  if (!id || typeof id !== 'string') return false
  if (!groupId || typeof groupId !== 'string') return false
  if (!name || typeof name !== 'string') return false
  if (description && typeof description !== 'string') return false
  if (!topic || typeof topic !== 'string') return false
  if (qos !== 0 && qos !== 1 && qos !== 2) return false
  if (payload && typeof payload !== 'string') return false
  if (typeof retained !== 'boolean') return false

  return true
}
