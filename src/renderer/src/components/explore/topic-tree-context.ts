import type { InjectionKey } from 'vue'

export type TopicTreeContext = {
  clientKey: () => string
  isVisible: (path: string) => boolean
  isOpen: (path: string) => boolean
  setOpen: (path: string, opened: boolean) => void
  select: (path: string) => void
}

export const topicTreeContextKey: InjectionKey<TopicTreeContext> = Symbol('topic-tree-context')

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
