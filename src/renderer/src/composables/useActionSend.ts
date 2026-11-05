import SendActionDialog from '@renderer/components/tab-actions/dialogs/SendActionDialog.vue'
import { getPayloadVariablesCount } from '@renderer/assets/js/actions-variables'
import { applyVariables } from '@renderer/components/tab-actions/action-utils'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useActionsStore } from '@renderer/store/actions'
import { useOverlay, useToast } from '@nuxt/ui/composables'
import { Action } from '../../../types/actions'

export function useActionSend() {
  const mqttTopicsStore = useMqttTopicsStore()
  const actionsStore = useActionsStore()
  const overlay = useOverlay()
  const toast = useToast()

  const topicsFor = (connectionId: string) => mqttTopicsStore.getConnectionTopics(connectionId)

  const sendNow = (connectionId: string, action: Action, topics: string[]) => {
    for (const topic of topics) {
      actionsStore.sendAction(
        connectionId,
        { ...action, payload: applyVariables(action, {}) },
        topic
      )
    }

    toast.add({
      title: topics.length > 1 ? `Sent to ${topics.length} topics` : `“${action.name}” sent`,
      description: topics.length > 1 ? undefined : topics[0],
      icon: 'i-lucide-send',
      color: 'success',
      duration: 1500
    })
  }

  const send = async (
    connectionId: string,
    action: Action,
    topics: string[] = [action.topic],
    editableTopic = false
  ): Promise<boolean> => {
    if (!editableTopic && !getPayloadVariablesCount(action.payload)) {
      sendNow(connectionId, action, topics)
      return true
    }

    const instance = overlay
      .create(SendActionDialog, { destroyOnClose: true })
      .open({ action, connectionId, topics, editableTopic })

    return !!(await instance.result)
  }

  return { send, topicsFor }
}
