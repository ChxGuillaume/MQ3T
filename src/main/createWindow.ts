import { registerDataGraphHandler } from './stores/dataGraph'
import iconIcns from '../../build/logo/mac512pts.icns?asset'
import iconIco from '../../build/logo/win512pts.ico?asset'
import { BrowserWindow, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import path from 'path'

export const createWindow = (routePath = '/') => {
  const windowConfig = {
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
    }
  }

  const window = new BrowserWindow(windowConfig)

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
      await window.loadFile(path.join(__dirname, `../renderer/index.html#${routePath}`))
    }
  }

  void loadWindow(window)

  return window
}
