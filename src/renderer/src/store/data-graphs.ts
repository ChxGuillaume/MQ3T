import { defineStore } from 'pinia'
import { v4 as uuidV4 } from 'uuid'

export type DataGraph = {
  id: string | null
  clientKey: string
  topic: string
  dataPath: string
  color?: string
  size?: 'small' | 'medium' | 'large'
  curveType?: 'linear' | 'curve' | 'step-start' | 'step-end'
}

export const useDataGraphsStore = defineStore('data-graphs', {
  state: () => ({
    dataGraph: [] as DataGraph[]
  }),
  actions: {
    setDataGraphs(dataGraphs: DataGraph[]) {
      this.dataGraph = dataGraphs
    },
    addDataGraph(dataGraph: Omit<DataGraph, 'id' | 'size'>) {
      const hasDuplicate = this.dataGraph.some(
        (graph) =>
          graph.clientKey === dataGraph.clientKey &&
          graph.topic === dataGraph.topic &&
          graph.dataPath === dataGraph.dataPath
      )

      if (hasDuplicate) return

      this.dataGraph.push({ ...dataGraph, size: 'small', curveType: 'curve', id: uuidV4() })
    },
    removeDataGraph(id: DataGraph['id']) {
      this.dataGraph = this.dataGraph.filter((graph) => graph.id !== id)
    },
    setDataGraphSize(id: DataGraph['id'], size: 'small' | 'medium' | 'large') {
      this.dataGraph.find((graph) => graph.id === id)!.size = size
    },
    setDataGraphColor(id: DataGraph['id'], color: string) {
      this.dataGraph.find((graph) => graph.id === id)!.color = color
    },
    setDataGraphCurveType(
      id: DataGraph['id'],
      curveType: 'linear' | 'curve' | 'step-start' | 'step-end'
    ) {
      this.dataGraph.find((graph) => graph.id === id)!.curveType = curveType
    }
  }
})
