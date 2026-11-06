import { useActionsStore } from '@renderer/store/actions'
import { Action, ChainActionNode } from '../../../../types/actions'

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
