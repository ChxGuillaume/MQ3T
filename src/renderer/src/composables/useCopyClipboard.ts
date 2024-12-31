import { useQuasar } from 'quasar'

export function useCopyClipboard() {
  const $q = useQuasar()

  const copy = (text: string, message: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        $q.notify({
          message,
          icon: 'fa-solid fa-clipboard',
          color: 'positive',
          timeout: 1000
        })
      })
      .catch(() => {
        $q.notify({
          message: 'Failed to copy to clipboard',
          icon: 'fa-solid fa-exclamation-circle',
          color: 'negative',
          timeout: 1000
        })
      })
  }

  return { copy }
}
