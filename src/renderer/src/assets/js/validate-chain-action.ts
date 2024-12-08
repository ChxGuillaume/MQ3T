import { ChainAction } from '../../../../types/actions'

export const validateChainAction = (action: ChainAction): boolean => {
  if (!action) return false
  if (typeof action !== 'object') return false

  const { id, groupId, name, nodes, edges } = action

  if (!id || typeof id !== 'string') return false
  if (!groupId || typeof groupId !== 'string') return false
  if (!name || typeof name !== 'string') return false
  if (!nodes || !Array.isArray(nodes)) return false
  if (!edges || !Array.isArray(edges)) return false

  return true
}
