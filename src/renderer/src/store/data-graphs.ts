import { ElectronApi } from '@renderer/assets/js/electron-api'
import { DataGraph } from '../../../types/data-graph'
import { defineStore } from 'pinia'
import { v4 as uuidV4 } from 'uuid'

export const useDataGraphsStore = defineStore('data-graphs', {
  state: () => ({
    dataGraph: [] as DataGraph[]
  }),
  actions: {
    initStore() {
      const graphs = ElectronApi.getDataGraphsSync()

      if (graphs && graphs.length > 0) {
        this.dataGraph = graphs
      }

      ElectronApi.handleDataGraphsUpdate((_, graphs) => {
        this.dataGraph = graphs
      })

      ElectronApi.handleDataGraphPartialUpdate((_, { id, updates }) => {
        const graphIndex = this.dataGraph.findIndex((graph) => graph.id === id)

        if (graphIndex !== -1) {
          this.dataGraph[graphIndex] = { ...this.dataGraph[graphIndex], ...updates }
        }
      })
    },
    setDataGraphs(dataGraphs: DataGraph[]) {
      this.dataGraph = dataGraphs

      this.saveToMain()
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

      this.saveToMain()
    },
    removeDataGraph(id: DataGraph['id']) {
      this.dataGraph = this.dataGraph.filter((graph) => graph.id !== id)

      this.saveToMain()
    },
    setDataGraphSize(id: DataGraph['id'], size: 'small' | 'medium' | 'large') {
      this.updateGraphProperty(id, 'size', size)
    },
    setDataGraphColor(id: DataGraph['id'], color: string) {
      this.updateGraphProperty(id, 'color', color)
    },
    setDataGraphCurveType(
      id: DataGraph['id'],
      curveType: 'linear' | 'curve' | 'step-start' | 'step-end'
    ) {
      this.updateGraphProperty(id, 'curveType', curveType)
    },
    updateGraphProperty<K extends keyof DataGraph>(
      id: DataGraph['id'],
      key: K,
      value: DataGraph[K]
    ) {
      const graph = this.dataGraph.find((graph) => graph.id === id)

      if (graph) {
        ElectronApi.updateDataGraph({ id: graph.id as string, updates: { [key]: value } })
        graph[key] = value
      }
    },
    saveToMain() {
      ElectronApi.saveDataGraphs(JSON.parse(JSON.stringify(this.dataGraph)))
    }
  }
})
