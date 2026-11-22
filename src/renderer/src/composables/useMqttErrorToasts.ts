import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useAppNavigation } from '@renderer/composables/useAppNavigation'
import { useAppStore } from '@renderer/store/app-store'
import { useToast } from '@nuxt/ui/composables'
import { watch } from 'vue'

const toastId = (clientKey: string) => `mqtt-error:${clientKey}`

/**
 * A failing broker emits an error on every reconnect attempt. The open tab already shows the
 * error in its banner, so only background tabs get a toast, and only once per outage.
 */
export function useMqttErrorToasts() {
  const mqttConnectionsStore = useMqttConnectionsStore()
  const appStore = useAppStore()
  const toast = useToast()
  const { selectedClientKey, openConnection } = useAppNavigation()

  const notified = new Set<string>()

  const isVisible = (clientKey: string) =>
    appStore.view === 'connection' && selectedClientKey.value === clientKey

  // Opening the failing tab shows the banner, so its toast is no longer needed.
  watch([() => appStore.view, selectedClientKey], () => {
    if (isVisible(selectedClientKey.value)) toast.remove(toastId(selectedClientKey.value))
  })

  const notifyError = (clientKey: string, message: string) => {
    if (isVisible(clientKey) || notified.has(clientKey)) return

    const connection = mqttConnectionsStore.getConnection(clientKey)

    if (!connection) return

    notified.add(clientKey)

    toast.add({
      id: toastId(clientKey),
      title: connection.name,
      description: message,
      color: 'error',
      icon: 'i-lucide-circle-alert',
      actions: [
        {
          label: 'Open',
          color: 'neutral',
          variant: 'outline',
          onClick: () => openConnection(clientKey)
        }
      ]
    })
  }

  const resetError = (clientKey: string) => {
    if (!notified.delete(clientKey)) return

    toast.remove(toastId(clientKey))
  }

  return { notifyError, resetError }
}
