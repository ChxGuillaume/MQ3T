import { useActionsStore } from '@renderer/store/actions'
import { Action, ChainAction, ChainActionNode } from '../../../../types/actions'

export type ResolvedNodeAction = {
  action?: Action
  linked: boolean
  missing: boolean
}

export const resolveNodeAction = (
  node: ChainActionNode,
  connectionId: string
): ResolvedNodeAction => {
  if (node.type !== 'action') return { linked: false, missing: false }

  const { action, actionId, topicOverride } = node.data ?? {}

  if (!actionId) return { action, linked: false, missing: false }

  const saved = useActionsStore()
    .getConnectionActions(connectionId)
    .find((candidate) => candidate.id === actionId)

  if (!saved) return { action, linked: true, missing: true }

  return { action: { ...saved, topic: topicOverride || saved.topic }, linked: true, missing: false }
}

export const detachUnresolvedLinks = <T extends Pick<ChainAction, 'nodes'>>(
  chain: T,
  connectionId: string
): T => ({
  ...chain,
  nodes: chain.nodes.map((node) => {
    if (node.type !== 'action' || !node.data?.actionId) return node

    const { missing } = resolveNodeAction(node, connectionId)

    if (!missing) return node

    const { actionId: _actionId, topicOverride: _topicOverride, ...data } = node.data

    return { ...node, data }
  })
})
