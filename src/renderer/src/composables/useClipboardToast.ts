import { useToast } from '@nuxt/ui/composables'

export function useClipboardToast() {
  const toast = useToast()

  const copy = (text: string, title = 'Copied to clipboard') => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.add({ title, icon: 'i-lucide-clipboard-check', color: 'success' }))
      .catch(() =>
        toast.add({
          title: 'Failed to copy to clipboard',
          icon: 'i-lucide-circle-alert',
          color: 'error'
        })
      )
  }

  return { copy }
}
