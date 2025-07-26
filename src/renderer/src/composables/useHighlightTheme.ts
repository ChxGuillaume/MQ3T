import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'

import light from '@renderer/assets/css/themes/highlightjs/light.scss?inline'
import dark from '@renderer/assets/css/themes/highlightjs/dark.scss?inline'

export function useHighlightTheme() {
  const $q = useQuasar()
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
    loadThemeCSS($q.dark.isActive)
  })

  onBeforeUnmount(() => {
    if (themeStyleElement) {
      document.head.removeChild(themeStyleElement)
      themeStyleElement = null
    }
  })

  watch(
    () => $q.dark.isActive,
    (isDark) => loadThemeCSS(isDark)
  )

  return { loadThemeCSS }
}
