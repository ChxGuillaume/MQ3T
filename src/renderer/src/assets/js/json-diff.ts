import { MAX_PARSE_LENGTH, parsePayload } from './payload-insight'

export type JsonChange = {
  path: string
  type: 'changed' | 'added' | 'removed'
  before?: unknown
  after?: unknown
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object'

const joinPath = (base: string, key: string | number) => {
  if (typeof key === 'number') return `${base}[${key}]`

  return base ? `${base}.${key}` : key
}

export const diffValues = (before: unknown, after: unknown, limit = 500): JsonChange[] => {
  const changes: JsonChange[] = []

  const walk = (a: unknown, b: unknown, path: string) => {
    if (changes.length >= limit) return

    if (isObject(a) && isObject(b) && Array.isArray(a) === Array.isArray(b)) {
      if (Array.isArray(a) && Array.isArray(b)) {
        const length = Math.max(a.length, b.length)

        for (let i = 0; i < length; i++) {
          const childPath = joinPath(path, i)

          if (i >= a.length) changes.push({ path: childPath, type: 'added', after: b[i] })
          else if (i >= b.length) changes.push({ path: childPath, type: 'removed', before: a[i] })
          else walk(a[i], b[i], childPath)
        }

        return
      }

      const keys = new Set([...Object.keys(a), ...Object.keys(b)])

      for (const key of keys) {
        const childPath = joinPath(path, key)

        if (!(key in a)) changes.push({ path: childPath, type: 'added', after: b[key] })
        else if (!(key in b)) changes.push({ path: childPath, type: 'removed', before: a[key] })
        else walk(a[key], b[key], childPath)
      }

      return
    }

    if (a !== b && JSON.stringify(a) !== JSON.stringify(b)) {
      changes.push({ path, type: 'changed', before: a, after: b })
    }
  }

  walk(before, after, '')

  return changes
}

export const diffMessages = (before: string | undefined, after: string): JsonChange[] => {
  if (before === undefined) return []
  if (before === after) return []

  if (before.length > MAX_PARSE_LENGTH || after.length > MAX_PARSE_LENGTH) {
    return [{ path: '', type: 'changed', before, after }]
  }

  const a = parsePayload(before)
  const b = parsePayload(after)

  if (a.kind === 'json' && b.kind === 'json') return diffValues(a.value, b.value)

  return [{ path: '', type: 'changed', before: a.value, after: b.value }]
}

export const summarizeChanges = (changes: JsonChange[]) => ({
  changed: changes.filter((c) => c.type === 'changed').length,
  added: changes.filter((c) => c.type === 'added').length,
  removed: changes.filter((c) => c.type === 'removed').length
})

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const pathMatchesFilter = (path: string, filter: string) => {
  const pattern = escapeRegExp(filter).replace(/\\\[\\\*\\\]/g, '\\[\\d+\\]')

  return new RegExp(`^${pattern}($|[.[])`).test(path)
}

export const filterChanges = (changes: JsonChange[], keyFilters: string[]) => {
  if (!keyFilters.length) return changes

  return changes.filter((change) => keyFilters.some((f) => pathMatchesFilter(change.path, f)))
}

export const leafPaths = (value: unknown, prefix = '', depth = 0): string[] => {
  const self = prefix ? [prefix] : []

  if (!isObject(value) || depth > 6) return self

  const children = Array.isArray(value)
    ? value.slice(0, 1).flatMap((item) => leafPaths(item, `${prefix}[*]`, depth + 1))
    : Object.entries(value).flatMap(([key, item]) =>
        leafPaths(item, joinPath(prefix, key), depth + 1)
      )

  return [...self, ...children]
}
