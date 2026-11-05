import { useColorMode } from '@vueuse/core'
import { computed } from 'vue'

export type AppColorMode = 'auto' | 'light' | 'dark'

export function migrateLegacyColorMode() {
  const legacy = localStorage.getItem('darkMode')
  if (legacy === null) return

  const mode: AppColorMode = legacy === 'true' ? 'dark' : legacy === 'false' ? 'light' : 'auto'
  localStorage.setItem('vueuse-color-scheme', mode)
  localStorage.removeItem('darkMode')
}

export function useAppColorMode() {
  const colorMode = useColorMode()

  const isDark = computed(() => colorMode.state.value === 'dark')

  return { mode: colorMode.store, isDark }
}
