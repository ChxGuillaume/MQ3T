import { getComputerDetails, getComputerOs } from '../../utils/getComputerDetails'
import { getCertificate } from '../../utils/generateCertificate'
import { bonjourName } from '../../constants/bonjourName'
import { Request, Response } from 'express'
import { app } from 'electron'

export const getDeviceInfo = () => {
  const certificate = getCertificate()

  return {
    os: getComputerOs(),
    version: app.getVersion(),
    platform: process.platform,
    bonjourName,
    computerName: getComputerDetails() || 'Unknown',
    certificateFingerprint: certificate.fingerprint,
    certificateFingerprintSha256: `sha256/${certificate.fingerprint}`
  }
}

export const getDeviceInfos = (_: Request, res: Response) => {
  res.json(getDeviceInfo())
}
