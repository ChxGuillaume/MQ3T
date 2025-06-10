import forge from 'node-forge'
import { app } from 'electron'
import * as fs from 'node:fs'
import * as os from 'node:os'
import crypto from 'crypto'
import path from 'path'

const CONFIG_FOLDER = path.join(app.getPath('userData'), 'config/certs/express')
const CONFIG_FILES = {
  cert: path.join(CONFIG_FOLDER, 'cert.pem'),
  key: path.join(CONFIG_FOLDER, 'key.pem'),
  fingerprint: path.join(CONFIG_FOLDER, 'fingerprint.txt')
}

if (!fs.existsSync(CONFIG_FOLDER)) fs.mkdirSync(CONFIG_FOLDER, { recursive: true })

const checkCertificateExists = () => {
  return fs.existsSync(CONFIG_FILES.cert) && fs.existsSync(CONFIG_FILES.key)
}

const generateCertificate = () => {
  const pki = forge.pki
  const keys = pki.rsa.generateKeyPair(2048)
  const cert = pki.createCertificate()

  cert.publicKey = keys.publicKey
  cert.serialNumber = '01'
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 5)

  const attrs = [
    { name: 'commonName', value: 'MQ3T' },
    { name: 'countryName', value: 'FR' }
  ]

  cert.setSubject(attrs)
  cert.setIssuer(attrs)

  cert.setExtensions([
    { name: 'basicConstraints', cA: true },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      timeStamping: true
    },
    {
      name: 'nsCertType',
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true
    },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 2, value: os.hostname() }
      ]
    }
  ])

  cert.sign(keys.privateKey, forge.md.sha256.create())

  const certPem = pki.certificateToPem(cert)
  const keyPem = pki.privateKeyToPem(keys.privateKey)

  const pubKeyObject = crypto.createPublicKey(certPem)
  const der = pubKeyObject.export({ type: 'spki', format: 'der' })
  const hash = crypto.createHash('sha256').update(der).digest()
  const fingerprint = hash.toString('base64')

  return {
    certPem,
    keyPem,
    fingerprint
  }
}

export const getCertificate = () => {
  if (checkCertificateExists())
    return {
      certPem: fs.readFileSync(CONFIG_FILES.cert, 'utf8'),
      keyPem: fs.readFileSync(CONFIG_FILES.key, 'utf8'),
      fingerprint: fs.readFileSync(CONFIG_FILES.fingerprint, 'utf8')
    }

  const { certPem, keyPem, fingerprint } = generateCertificate()

  fs.writeFileSync(CONFIG_FILES.cert, certPem)
  fs.writeFileSync(CONFIG_FILES.key, keyPem)
  fs.writeFileSync(CONFIG_FILES.fingerprint, fingerprint)

  return {
    certPem,
    keyPem,
    fingerprint
  }
}
