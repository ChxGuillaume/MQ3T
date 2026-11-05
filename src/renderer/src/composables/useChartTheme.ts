import { useAppColorMode } from '@renderer/composables/useAppColorMode'
import { createSharedComposable } from '@vueuse/core'
import { nextTick, ref, watch } from 'vue'

export type ChartTheme = {
  text: string
  muted: string
  border: string
  grid: string
  surface: string
  primary: string
  fontSans: string
  fontMono: string
}

const readVar = (styles: CSSStyleDeclaration, name: string) => styles.getPropertyValue(name).trim()

const readTheme = (): ChartTheme => {
  const styles = getComputedStyle(document.documentElement)

  return {
    text: readVar(styles, '--ui-text'),
    muted: readVar(styles, '--ui-text-muted'),
    border: readVar(styles, '--ui-border'),
    grid: readVar(styles, '--ui-border-muted'),
    surface: readVar(styles, '--ui-bg'),
    primary: readVar(styles, '--ui-primary'),
    fontSans: readVar(styles, '--font-sans'),
    fontMono: readVar(styles, '--font-mono')
  }
}

export const resolveCssColor = (color: string) => {
  const match = color.match(/^var\((--[\w-]+)\)$/)
  if (!match) return color

  return getComputedStyle(document.documentElement).getPropertyValue(match[1]).trim()
}

export const useChartTheme = createSharedComposable(() => {
  const { isDark } = useAppColorMode()
  const theme = ref<ChartTheme>(readTheme())

  watch(isDark, () => nextTick(() => (theme.value = readTheme())), { flush: 'post' })

  return { theme, isDark }
})
