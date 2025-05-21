import { BrowserWindow, ipcMain } from 'electron'
import { DataGraph } from '../../types/data-graph'

let dataGraph: DataGraph[] = []
const registeredWindows = new Set<BrowserWindow>()

const sendMessage = (channel: string, data: any) => {
  for (const window of registeredWindows) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data)
    }
  }
}

export const registerDataGraphHandler = (window: BrowserWindow) => {
  if (registeredWindows.has(window)) return

  registeredWindows.add(window)

  if (!window.isDestroyed()) {
    window.webContents.send('load-data-graphs', dataGraph)
  }
}

export const unregisterDataGraphHandler = (window: BrowserWindow) => {
  registeredWindows.delete(window)
}

export const initDataGraphHandlers = () => {
  ipcMain.on('save-data-graphs', (_, graphs) => {
    dataGraph = graphs
    sendMessage('load-data-graphs', graphs)
  })

  ipcMain.on('update-data-graph', (_, { id, updates }) => {
    const graphIndex = dataGraph.findIndex((graph) => graph.id === id)

    if (graphIndex === -1) return

    dataGraph[graphIndex] = { ...dataGraph[graphIndex], ...updates }
    sendMessage('update-data-graph-partial', { id, updates })
  })

  ipcMain.on('get-data-graphs-sync', (event) => {
    event.returnValue = dataGraph
  })
}
