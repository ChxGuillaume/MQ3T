import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useAppColorMode } from '@renderer/composables/useAppColorMode'

import light from '@renderer/assets/css/themes/highlightjs/light.scss?inline'
import dark from '@renderer/assets/css/themes/highlightjs/dark.scss?inline'

export function useHighlightTheme() {
  const { isDark } = useAppColorMode()
  let themeStyleElement: HTMLStyleElement | null = null

  function loadThemeCSS(isDark: boolean) {
    if (themeStyleElement) {
      document.head.removeChild(themeStyleElement)
      themeStyleElement = null
    }

    themeStyleElement = document.createElement('style')
    themeStyleElement.setAttribute('data-highlight-theme', isDark ? 'dark' : 'light')

    themeStyleElement.textContent = isDark ? dark : light

    document.head.appendChild(themeStyleElement)
  }

  onMounted(() => {
    loadThemeCSS(isDark.value)
  })

  onBeforeUnmount(() => {
    if (themeStyleElement) {
      document.head.removeChild(themeStyleElement)
      themeStyleElement = null
    }
  })

  watch(isDark, (value) => loadThemeCSS(value))

  return { loadThemeCSS }
}
