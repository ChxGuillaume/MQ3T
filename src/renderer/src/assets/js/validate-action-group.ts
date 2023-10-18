import { ActionGroup } from '../../../../types/actions'

export const validateActionGroup = (actionGroup: ActionGroup) => {
  if (!actionGroup) return false
  if (typeof actionGroup !== 'object') return false

  const { id, name, description } = actionGroup

  if (!id || typeof id !== 'string') return false
  if (!name || typeof name !== 'string') return false
  if (description && typeof description !== 'string') return false

  return true
}
