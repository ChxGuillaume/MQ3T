import { onBeforeUnmount, ref, Ref } from 'vue'

const DRAG_THRESHOLD = 4
const SLIDE_DURATION = 150
const SLIDE_TRANSITION = `transform ${SLIDE_DURATION}ms ease`

interface TabDragOptions {
  container: Ref<HTMLElement | null>
  itemSelector: string
  onDragStart: (index: number) => void
  onReorder: (from: number, to: number) => void
}

interface DragSession {
  from: number
  to: number
  startX: number
  items: HTMLElement[]
  rects: DOMRect[]
  slotShift: number
  started: boolean
}

export function useTabDragReorder(options: TabDragOptions) {
  const draggingIndex = ref<number | null>(null)

  let session: DragSession | null = null
  let settleTimer: number | undefined

  const getItems = () =>
    Array.from(
      options.container.value?.querySelectorAll<HTMLElement>(`:scope > ${options.itemSelector}`) ??
        []
    )

  const resetStyles = (items: HTMLElement[]) => {
    items.forEach((item) => {
      item.style.transform = ''
      item.style.transition = ''
      item.style.zIndex = ''
      item.style.position = ''
    })
  }

  const removeListeners = () => {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
  }

  const beginDrag = (current: DragSession) => {
    current.started = true
    draggingIndex.value = current.from

    const dragged = current.items[current.from]

    dragged.style.position = 'relative'
    dragged.style.zIndex = '10'

    current.items.forEach((item, index) => {
      if (index !== current.from) item.style.transition = SLIDE_TRANSITION
    })

    options.onDragStart(current.from)
  }

  const clampOffset = (current: DragSession, offset: number) => {
    const draggedRect = current.rects[current.from]
    const minOffset = current.rects[0].left - draggedRect.left
    const maxOffset = current.rects[current.rects.length - 1].right - draggedRect.right

    return Math.min(Math.max(offset, minOffset), maxOffset)
  }

  const targetIndexFor = (current: DragSession, draggedLeft: number, draggedRight: number) => {
    let target = current.from

    current.rects.forEach((rect, index) => {
      const center = rect.left + rect.width / 2

      if (index > current.from && draggedRight > center) target = Math.max(target, index)
      if (index < current.from && draggedLeft < center) target = Math.min(target, index)
    })

    return target
  }

  const shiftSiblings = (current: DragSession) => {
    current.items.forEach((item, index) => {
      if (index === current.from) return

      const movesLeft = index > current.from && index <= current.to
      const movesRight = index < current.from && index >= current.to

      if (movesLeft) item.style.transform = `translateX(${-current.slotShift}px)`
      else if (movesRight) item.style.transform = `translateX(${current.slotShift}px)`
      else item.style.transform = ''
    })
  }

  const onPointerMove = (event: PointerEvent) => {
    const current = session

    if (!current) return

    const rawOffset = event.clientX - current.startX

    if (!current.started) {
      if (Math.abs(rawOffset) < DRAG_THRESHOLD) return

      beginDrag(current)
    }

    const offset = clampOffset(current, rawOffset)
    const draggedRect = current.rects[current.from]

    current.items[current.from].style.transform = `translateX(${offset}px)`
    current.to = targetIndexFor(current, draggedRect.left + offset, draggedRect.right + offset)

    shiftSiblings(current)
  }

  const finishDrag = (current: DragSession) => {
    resetStyles(current.items)
    draggingIndex.value = null

    if (current.to !== current.from) options.onReorder(current.from, current.to)
  }

  const onPointerUp = () => {
    const current = session

    removeListeners()
    session = null

    if (!current?.started) return

    const draggedRect = current.rects[current.from]
    const targetRect = current.rects[current.to]
    const finalLeft =
      current.to > current.from ? targetRect.right - draggedRect.width : targetRect.left
    const dragged = current.items[current.from]

    dragged.style.transition = SLIDE_TRANSITION
    dragged.style.transform = `translateX(${finalLeft - draggedRect.left}px)`

    settleTimer = window.setTimeout(() => finishDrag(current), SLIDE_DURATION)
  }

  const onPointerDown = (event: PointerEvent, index: number) => {
    if (event.button !== 0 || session || draggingIndex.value !== null) return
    if ((event.target as HTMLElement).closest('button')) return

    const items = getItems()

    if (!items[index]) return

    const rects = items.map((item) => item.getBoundingClientRect())
    const gap = parseFloat(getComputedStyle(options.container.value!).columnGap) || 0

    session = {
      from: index,
      to: index,
      startX: event.clientX,
      items,
      rects,
      slotShift: rects[index].width + gap,
      started: false
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  onBeforeUnmount(() => {
    removeListeners()
    window.clearTimeout(settleTimer)
  })

  return { draggingIndex, onPointerDown }
}
