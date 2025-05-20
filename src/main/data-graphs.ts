import { BrowserWindow, ipcMain } from 'electron'
import { DataGraph } from '../types/data-graph'

let dataGraphs: DataGraph[] = []

const sendMessage = (windows: Array<BrowserWindow | null>, channel: string, data: any) => {
  for (const window of windows) {
    window?.webContents.send(channel, data)
  }
}

export const registerDataGraphHandlers = (...windows: Array<BrowserWindow | null>) => {
  ipcMain.on('save-data-graphs', (_, graphs) => {
    dataGraphs = graphs

    sendMessage(windows, 'load-data-graphs', graphs)
  })

  ipcMain.on('update-data-graph', (_, { id, updates }) => {
    const graphIndex = dataGraphs.findIndex((graph) => graph.id === id)

    if (!graphIndex) return

    dataGraphs[graphIndex] = { ...dataGraphs[graphIndex], ...updates }

    sendMessage(windows, 'update-data-graph-partial', { id, updates })
  })

  ipcMain.on('get-data-graphs-sync', (event) => {
    event.returnValue = dataGraphs
  })
}
