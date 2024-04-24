import { defineStore } from 'pinia'
import { v4 as uuidV4 } from 'uuid'

export type DataGraph = {
  id: string
  clientKey: string
  topic: string
  dataPath: string
  size: 'small' | 'medium' | 'large'
}

export const useDataGraphs = defineStore('data-graphs', {
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

      this.dataGraph.push({ ...dataGraph, size: 'small', id: uuidV4() })
    },
    removeDataGraph(id: string) {
      this.dataGraph = this.dataGraph.filter((graph) => graph.id !== id)
    },
    setDataGraphSize(id: string, size: 'small' | 'medium' | 'large') {
      this.dataGraph = this.dataGraph.map((graph) => {
        if (graph.id === id) {
          return { ...graph, size }
        }

        return graph
      })
    }
  }
})
