import type { InjectionKey } from 'vue'

export type TopicTreeContext = {
  clientKey: () => string
  isVisible: (path: string) => boolean
  isOpen: (path: string) => boolean
  setOpen: (path: string, opened: boolean) => void
  select: (path: string) => void
}

export const topicTreeContextKey: InjectionKey<TopicTreeContext> = Symbol('topic-tree-context')

export const topicListGridClass =
  'grid grid-cols-[28px_minmax(0,1fr)_minmax(220px,2fr)_64px_84px] gap-x-4'

export const highlightSegments = (text: string, keywords: string[]) => {
  const lower = text.toLowerCase()
  const hits = new Array<boolean>(text.length).fill(false)

  for (const keyword of keywords) {
    for (let i = lower.indexOf(keyword); i !== -1; i = lower.indexOf(keyword, i + 1)) {
      hits.fill(true, i, i + keyword.length)
    }
  }

  const segments: { text: string; hit: boolean }[] = []

  for (let i = 0; i < text.length; i++) {
    const last = segments[segments.length - 1]

    if (last && last.hit === hits[i]) last.text += text[i]
    else segments.push({ text: text[i], hit: hits[i] })
  }

  return segments
}

export const sortTopicKeys = (a: string, b: string) => {
  const parsedA = Number(a)
  const parsedB = Number(b)
  const aIsNumber = a !== '' && !isNaN(parsedA)
  const bIsNumber = b !== '' && !isNaN(parsedB)

  if (!aIsNumber && !bIsNumber) return a.localeCompare(b)
  if (!aIsNumber) return 1
  if (!bIsNumber) return -1

  return parsedA - parsedB
}
