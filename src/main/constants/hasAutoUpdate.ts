const IS_MAS = process.mas
const IS_WINDOWS_STORE = process.windowsStore
const IS_SNAP = process.env.SNAP
const IS_FLATPAK_ID = process.env.FLATPAK_ID

export const HasAutoUpdate = !IS_MAS && !IS_WINDOWS_STORE && !IS_SNAP && !IS_FLATPAK_ID
