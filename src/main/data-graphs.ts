import { BrowserWindow, ipcMain } from 'electron'
import { DataGraph } from '../types/data-graph'

let dataGraphs: DataGraph[] = []

export const registerDataGraphHandlers = (
  mainWindow: BrowserWindow | null,
  graphWindow: BrowserWindow | null
) => {
  ipcMain.on('save-data-graphs', (_, graphs) => {
    dataGraphs = graphs

    mainWindow?.webContents.send('load-data-graphs', graphs)
    graphWindow?.webContents.send('load-data-graphs', graphs)
  })

  ipcMain.on('update-data-graph', (_, { id, updates }) => {
    const graphIndex = dataGraphs.findIndex((graph) => graph.id === id)
    if (graphIndex !== -1) {
      dataGraphs[graphIndex] = { ...dataGraphs[graphIndex], ...updates }

      mainWindow?.webContents.send('update-data-graph-partial', { id, updates })
      graphWindow?.webContents.send('update-data-graph-partial', { id, updates })
    }
  })

  ipcMain.on('get-data-graphs-sync', (event) => {
    event.returnValue = dataGraphs
  })

  ipcMain.on('graph-window-event', (_, event) => {
    console.log(event)
    if (event.event === 'add-data-graph') {
      dataGraphs = event.data
    }
    graphWindow?.webContents.send('graph-window-event-2', event)
  })
}
