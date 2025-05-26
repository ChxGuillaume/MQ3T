import * as child_process from 'node:child_process'
import * as os from 'node:os'
import * as fs from 'node:fs'

/**
 * Credit to egoist
 * Based on https://github.com/egoist/computer-name/blob/master/index.js
 */
export const getComputerDetails = () => {
  switch (process.platform) {
    case 'win32':
      return process.env.COMPUTERNAME
    case 'darwin':
      return child_process.execSync('scutil --get ComputerName').toString().trim()
    default:
      return os.hostname()
  }
}

const getLinuxDistro = () => {
  try {
    const osRelease = fs.readFileSync('/etc/os-release', 'utf8')
    const os = osRelease.match(/^NAME="?(.*)"?$/m)?.[1]

    if (os?.startsWith('Ubuntu')) return 'ubuntu'
    else if (os?.startsWith('Debian')) return 'debian'
  } catch (e) {}

  return undefined
}

export const getComputerOs = () => {
  const platform = os.platform()

  switch (platform) {
    case 'win32':
      return 'windows'
    case 'darwin':
      return 'mac'
    case 'linux':
      return getLinuxDistro() || 'linux'
    default:
      return platform
  }
}
