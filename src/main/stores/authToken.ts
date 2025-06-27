import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import { app } from 'electron'
import * as fs from 'node:fs'
import { join } from 'path'
import { Low } from 'lowdb'

interface TokenDocument {
  id?: string
  token: string
  deviceName: string
  createdAt: Date
  updatedAt: Date
}

interface Schema {
  tokens: TokenDocument[]
}

fs.mkdirSync(join(app.getPath('userData'), 'database'), { recursive: true })

const adapter = new JSONFile<Schema>(join(app.getPath('userData'), 'database', 'tokens.json'))
const db = new Low(adapter, { tokens: [] })

const tokenCache = new Map<string, TokenDocument>()

export const createToken = async (params: { deviceName: string }): Promise<string> => {
  const token = `${uuidv4()}+${uuidv4()}`

  const doc: TokenDocument = {
    id: uuidv4(),
    token,
    deviceName: params.deviceName,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  await db.read()
  db.data.tokens.push(doc)
  await db.write()

  tokenCache.set(token, doc)

  return token
}

export const updateToken = async (oldToken: string, newToken: string): Promise<void> => {
  const existingDoc = await findToken(oldToken)

  if (!existingDoc) throw new Error('Token not found')

  await db.read()
  const tokenToUpdate = db.data.tokens.find((t) => t.token === oldToken)
  if (tokenToUpdate) {
    tokenToUpdate.token = newToken
    tokenToUpdate.updatedAt = new Date()
  }
  await db.write()

  tokenCache.delete(oldToken)

  const newDoc = {
    ...existingDoc,
    token: newToken,
    updatedAt: new Date()
  }

  tokenCache.set(newToken, newDoc)
}

export const deleteToken = async (token: string): Promise<void> => {
  await db.read()
  db.data.tokens = db.data.tokens.filter((t) => t.token !== token)
  await db.write()

  tokenCache.delete(token)
}

export const findToken = async (token: string): Promise<TokenDocument | null> => {
  const cachedToken = tokenCache.get(token)

  if (cachedToken) return cachedToken

  await db.read()
  const doc = db.data.tokens.find((t) => t.token === token) || null

  if (doc) {
    tokenCache.set(token, doc)
  }

  return doc
}
