import { ElectronApi, HasAutoUpdate } from '@renderer/assets/js/electron-api'
import { useAppStore } from '@renderer/store/app-store'
import type { ProgressInfo, UpdateInfo } from 'electron-updater'
import { useToast } from '@nuxt/ui/composables'
import { computed, ref } from 'vue'

export type UpdateStatus =
  'idle' | 'checking' | 'up-to-date' | 'available' | 'downloading' | 'ready' | 'error'

const status = ref<UpdateStatus>('idle')
const info = ref<UpdateInfo | null>(null)
const progress = ref<ProgressInfo | null>(null)
const errorMessage = ref('')
const dialogOpen = ref(false)
const manualCheck = ref(false)

let listening = false

export const formatMegabytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`

export const releaseNotesItems = (notes: UpdateInfo['releaseNotes']): string[] => {
  if (!notes) return []

  const html = Array.isArray(notes) ? notes.map((n) => n.note ?? '').join('\n') : notes
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const items = Array.from(doc.querySelectorAll('li'))
    .map((li) => li.textContent?.trim() ?? '')
    .filter(Boolean)

  if (items.length) return items

  return (doc.body.textContent ?? '')
    .split('\n')
    .map((line) => line.replace(/^[\s*-]+/, '').trim())
    .filter(Boolean)
}

export function useAppUpdate() {
  const appStore = useAppStore()
  const toast = useToast()

  const percent = computed(() => progress.value?.percent ?? 0)

  const remainingSeconds = computed(() => {
    const p = progress.value
    if (!p || !p.bytesPerSecond) return null
    return Math.ceil((p.total - p.transferred) / p.bytesPerSecond)
  })

  const downloadSize = computed(() => {
    const size = info.value?.files?.[0]?.size
    return size ? formatMegabytes(size) : null
  })

  const checkForUpdates = () => {
    if (!HasAutoUpdate || appStore.workingOnUpdate) return
    manualCheck.value = true
    ElectronApi.checkForUpdates()
  }

  const download = () => {
    appStore.setWorkingOnUpdate(true)
    status.value = 'downloading'
    progress.value = null
    ElectronApi.downloadUpdate()
  }

  const install = () => {
    ElectronApi.quitAndInstallUpdate()
  }

  const listen = () => {
    if (listening) return
    listening = true

    ElectronApi.handleCheckForUpdates(() => {
      status.value = 'checking'
    })

    ElectronApi.handleUpdateError((_, value) => {
      status.value = 'error'
      errorMessage.value = value.message
      appStore.setWorkingOnUpdate(false)

      toast.add({
        title: 'Update failed',
        description: value.message,
        color: 'error',
        icon: 'i-lucide-circle-alert'
      })
    })

    ElectronApi.handleUpdateNotAvailable(() => {
      status.value = 'up-to-date'
      appStore.setWorkingOnUpdate(false)

      if (manualCheck.value) {
        toast.add({
          title: "You're up to date",
          description: `MQ3T ${appStore.appVersion} is the latest version.`,
          icon: 'i-lucide-circle-check'
        })
      }
      manualCheck.value = false
    })

    ElectronApi.handleUpdateAvailable((_, value) => {
      status.value = 'available'
      info.value = value
      manualCheck.value = false
      dialogOpen.value = true
    })

    ElectronApi.handleUpdateDownloadProgress((_, value) => {
      status.value = 'downloading'
      progress.value = value
    })

    ElectronApi.handleUpdateDownloaded((_, value) => {
      status.value = 'ready'
      info.value = value
      appStore.setWorkingOnUpdate(false)
      dialogOpen.value = true
    })
  }

  return {
    status,
    info,
    progress,
    percent,
    remainingSeconds,
    downloadSize,
    errorMessage,
    dialogOpen,
    checkForUpdates,
    download,
    install,
    listen
  }
}
