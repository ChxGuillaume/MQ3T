import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron'
import { MenuCommand } from '../types/electron-ipc-callbacks'
import { is } from '@electron-toolkit/utils'

const sendCommand = (getMainWindow: () => BrowserWindow, command: MenuCommand) => {
  const window = getMainWindow()
  const send = () => window.webContents.send('menu-command', command)

  if (window.webContents.isLoading()) window.webContents.once('did-finish-load', send)
  else send()

  window.show()
  window.focus()
}

export const initAppMenu = (getMainWindow: () => BrowserWindow) => {
  const commandItem = (
    label: string,
    accelerator: string,
    command: MenuCommand
  ): MenuItemConstructorOptions => ({
    label,
    accelerator,
    registerAccelerator: false,
    click: () => sendCommand(getMainWindow, command)
  })

  const template: MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        commandItem('Settings…', 'CmdOrCtrl+,', 'settings'),
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        commandItem('New Tab', 'CmdOrCtrl+T', 'new-tab'),
        commandItem('New Temporary Connection', 'Shift+CmdOrCtrl+T', 'temporary-connection'),
        { type: 'separator' },
        commandItem('Close Tab', 'CmdOrCtrl+W', 'close-tab'),
        { role: 'close', label: 'Close Window', accelerator: 'Shift+CmdOrCtrl+W' }
      ]
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        commandItem('Explore', 'CmdOrCtrl+1', 'section:explore'),
        commandItem('Actions', 'CmdOrCtrl+2', 'section:actions'),
        commandItem('Graphs', 'CmdOrCtrl+3', 'section:graphs'),
        commandItem('Broker', 'CmdOrCtrl+4', 'section:broker'),
        { type: 'separator' },
        commandItem('Next Tab', 'Ctrl+Tab', 'next-tab'),
        commandItem('Previous Tab', 'Ctrl+Shift+Tab', 'previous-tab'),
        { type: 'separator' },
        ...(is.dev
          ? ([
              { role: 'reload' },
              { role: 'toggleDevTools' },
              { type: 'separator' }
            ] as MenuItemConstructorOptions[])
          : []),
        { role: 'togglefullscreen' }
      ]
    },
    { role: 'windowMenu' }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
