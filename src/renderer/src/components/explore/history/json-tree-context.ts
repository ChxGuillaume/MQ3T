import type { JsonChange } from '@renderer/assets/js/json-diff'
import type { InjectionKey, Ref } from 'vue'

export type JsonTreeContext = {
  changes: Ref<Map<string, JsonChange>>
  onlyChanges: Ref<boolean>
  find: Ref<string>
  isExpanded: (path: string, depth: number) => boolean
  toggle: (path: string, depth: number) => void
  keyMenu: (path: string, value: unknown) => unknown[][]
}

export const jsonTreeContextKey: InjectionKey<JsonTreeContext> = Symbol('json-tree-context')

export const childPath = (base: string, key: string | number) => {
  if (typeof key === 'number') return `${base}[${key}]`

  return base ? `${base}.${key}` : key
}

export const isContainer = (value: unknown): value is Record<string, unknown> | unknown[] =>
  value !== null && typeof value === 'object'

export const hasChangeBelow = (changes: Map<string, JsonChange>, path: string) => {
  if (path === '') return changes.size > 0

  for (const key of changes.keys()) {
    if (key === path || key.startsWith(`${path}.`) || key.startsWith(`${path}[`)) return true
  }

  return false
}

export const matchesFind = (key: string, value: unknown, find: string): boolean => {
  if (!find) return true

  const term = find.toLowerCase()

  if (key.toLowerCase().includes(term)) return true
  if (!isContainer(value)) return String(value).toLowerCase().includes(term)

  return Object.entries(value).some(([k, v]) => matchesFind(k, v, find))
}

export const tableColumns = (value: unknown[]): string[] | null => {
  if (value.length < 2) return null
  if (!value.every((item) => isContainer(item) && !Array.isArray(item))) return null

  const rows = value as Record<string, unknown>[]
  const columns = Object.keys(rows[0])

  if (columns.length > 8) return null

  const sameShape = rows.every(
    (row) =>
      Object.keys(row).length === columns.length &&
      columns.every((column) => column in row && !isContainer(row[column]))
  )

  return sameShape ? columns : null
}

export const valueClass = (value: unknown) => {
  if (typeof value === 'number') return 'text-code-num'
  if (typeof value === 'string') return 'text-code-str'

  return 'text-code-sym'
}
