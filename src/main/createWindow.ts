import { registerDataGraphHandler } from './stores/dataGraph'
import iconIcns from '../../build/logo/mac512pts.icns?asset'
import iconIco from '../../build/logo/win512pts.ico?asset'
import { BrowserWindow, ipcMain, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import path from 'path'

const DARK_MODE = { height: 40, color: '#121212', symbolColor: '#E675E4' }
const LIGHT_MODE = { height: 40, color: '#FFFFFF', symbolColor: '#650164' }

export const createWindow = (routePath = '/') => {
  const windowConfig: Electron.BrowserWindowConstructorOptions = {
    width: 1300,
    minWidth: 800,
    height: 800,
    minHeight: 600,
    icon: process.platform === 'darwin' ? iconIcns : iconIco,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    },

    titleBarStyle: 'hidden',
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    trafficLightPosition: { x: 12, y: 12 }
  }

  const window = new BrowserWindow(windowConfig)

  if (process.platform !== 'darwin') {
    window.setTitleBarOverlay(DARK_MODE)

    ipcMain.on('dark-mode', (_, value) => {
      if (value) window.setTitleBarOverlay(DARK_MODE)
      else window.setTitleBarOverlay(LIGHT_MODE)
    })
  }

  window.removeMenu()

  registerDataGraphHandler(window)

  window.on('ready-to-show', () => {
    window?.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url).then()

    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  const loadWindow = async (window: BrowserWindow) => {
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      await window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/index.html#${routePath}`)
    } else {
      await window.loadFile(path.join(__dirname, `../renderer/index.html`), { hash: routePath })
    }
  }

  void loadWindow(window)

  return window
}
