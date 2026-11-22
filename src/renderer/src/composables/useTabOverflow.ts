import { useEventListener, useMutationObserver, useResizeObserver, useScroll } from '@vueuse/core'
import { computed, Ref } from 'vue'

const EDGE_FADE = 32
const EDGE_TOLERANCE = 1

export function useTabOverflow(container: Ref<HTMLElement | null>) {
  const { arrivedState, measure } = useScroll(container, {
    offset: { left: EDGE_TOLERANCE, right: EDGE_TOLERANCE }
  })

  const canScrollLeft = computed(() => !arrivedState.left)
  const canScrollRight = computed(() => !arrivedState.right)
  const overflowing = computed(() => canScrollLeft.value || canScrollRight.value)

  useResizeObserver(container, measure)
  useMutationObserver(container, measure, { childList: true })

  // Mouse wheels only scroll vertically: map that onto the horizontal tab strip.
  useEventListener(
    container,
    'wheel',
    (event: WheelEvent) => {
      const el = container.value

      if (!el || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return

      el.scrollLeft += event.deltaY
      event.preventDefault()
    },
    { passive: false }
  )

  const scrollByPage = (direction: -1 | 1) => {
    const el = container.value

    if (!el) return

    el.scrollBy({ left: direction * el.clientWidth * 0.75, behavior: 'smooth' })
  }

  const scrollIntoView = (element: Element | null | undefined) => {
    element?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }

  const fadeMaskStyle = computed(() => {
    if (!overflowing.value) return undefined

    const left = canScrollLeft.value ? `transparent 0, black ${EDGE_FADE}px` : 'black 0'
    const right = canScrollRight.value
      ? `black calc(100% - ${EDGE_FADE}px), transparent 100%`
      : 'black 100%'
    const mask = `linear-gradient(to right, ${left}, ${right})`

    return { maskImage: mask, WebkitMaskImage: mask }
  })

  return { overflowing, canScrollLeft, canScrollRight, scrollByPage, scrollIntoView, fadeMaskStyle }
}
