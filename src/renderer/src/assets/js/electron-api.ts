import { ElectronIpc } from '../../../../types/electron-ipc-callbacks'

// @ts-ignore (define in dts)
export const ElectronApi = window?.api as ElectronIpc

// @ts-ignore (define in dts)
export const AppPlatform = window?.platform as 'win32' | 'linux' | 'darwin'
