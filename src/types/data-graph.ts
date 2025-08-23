export type DataGraph = {
  id: string | null
  clientKey: string
  topic: string
  dataPath: string
  color?: string
  size?: 'small' | 'medium' | 'large'
  curveType?: 'linear' | 'curve' | 'step-start' | 'step-end'
}
