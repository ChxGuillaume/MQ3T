// Prints a short-lived App Store Connect API token.
// https://developer.apple.com/documentation/appstoreconnectapi/generating-tokens-for-api-requests
import { readFileSync } from 'node:fs'
import { createPrivateKey, sign } from 'node:crypto'

const { KEY_FILE, KEY_ID, ISSUER } = process.env
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

const now = Math.floor(Date.now() / 1000)
const header = encode({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })
const payload = encode({ iss: ISSUER, iat: now, exp: now + 600, aud: 'appstoreconnect-v1' })

const key = createPrivateKey(readFileSync(KEY_FILE))
const signature = sign('sha256', Buffer.from(`${header}.${payload}`), { key, dsaEncoding: 'ieee-p1363' })

console.log(`${header}.${payload}.${signature.toString('base64url')}`)
