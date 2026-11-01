import type { DataGraph } from '../../../../types/data-graph'
import formatNumber from './format-number'

export type GraphSize = NonNullable<DataGraph['size']>
export type GraphCurveType = NonNullable<DataGraph['curveType']>

export const graphSizes: { label: string; value: GraphSize }[] = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' }
]

export const graphCurveTypes: { label: string; value: GraphCurveType }[] = [
  { label: 'Curve', value: 'curve' },
  { label: 'Linear', value: 'linear' },
  { label: 'Step start', value: 'step-start' },
  { label: 'Step end', value: 'step-end' }
]

export const graphColors: { label: string; value: string | undefined }[] = [
  { label: 'Brand', value: undefined },
  { label: 'Symbol', value: 'var(--code-sym)' },
  { label: 'String', value: 'var(--code-str)' },
  { label: 'Number', value: 'var(--code-num)' },
  { label: 'Binary', value: 'var(--code-bin)' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Lime', value: '#84cc16' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Sky', value: '#0ea5e9' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' }
]

export const graphTimeWindows: { label: string; value: number }[] = [
  { label: '1 min', value: 60_000 },
  { label: '5 min', value: 300_000 },
  { label: '15 min', value: 900_000 },
  { label: 'All', value: 0 }
]

export const graphChartHeights: Record<GraphSize, number> = {
  small: 90,
  medium: 140,
  large: 220
}

export const curveTypeLabel = (curveType?: GraphCurveType) =>
  graphCurveTypes.find((c) => c.value === (curveType ?? 'curve'))?.label ?? ''

export const dataPathLabel = (dataPath: string) => dataPath || '(raw value)'

export const formatGraphValue = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '–'
  if (Math.abs(value) >= 1e4) return String(formatNumber(value))

  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export const toGraphNumber = (value: unknown): number | null => {
  if (typeof value === 'boolean') return value ? 1 : 0
  if (value === null || value === undefined || value === '') return null

  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

export const findNumericPaths = (data: unknown, prefix = ''): string[] => {
  if (typeof data === 'number' || typeof data === 'boolean') return [prefix]
  if (data === null || typeof data !== 'object') return []

  const entries: [string, unknown][] = Array.isArray(data)
    ? data.map((value, index) => [`[${index}]`, value])
    : Object.entries(data)

  return entries.flatMap(([key, value]) =>
    findNumericPaths(value, prefix ? `${prefix}.${key}` : key)
  )
}
