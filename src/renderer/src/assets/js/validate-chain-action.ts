import { ChainAction } from '../../../../types/actions'

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const isValidNode = (node: unknown) =>
  isObject(node) && typeof node.id === 'string' && typeof node.type === 'string'

const isValidEdge = (edge: unknown) =>
  isObject(edge) && typeof edge.source === 'string' && typeof edge.target === 'string'

const isValidRepeat = (repeat: unknown) =>
  repeat === undefined ||
  (isObject(repeat) &&
    Number.isInteger(repeat.count) &&
    (repeat.count as number) >= 0 &&
    typeof repeat.interval === 'number' &&
    (repeat.interval as number) >= 0)

export const validateChainAction = (action: ChainAction): boolean => {
  if (!action) return false
  if (typeof action !== 'object') return false

  const { id, groupId, name, nodes, edges, repeat } = action

  if (!id || typeof id !== 'string') return false
  if (!groupId || typeof groupId !== 'string') return false
  if (!name || typeof name !== 'string') return false
  if (!nodes || !Array.isArray(nodes) || !nodes.every(isValidNode)) return false
  if (!edges || !Array.isArray(edges) || !edges.every(isValidEdge)) return false
  if (!isValidRepeat(repeat)) return false

  return true
}
