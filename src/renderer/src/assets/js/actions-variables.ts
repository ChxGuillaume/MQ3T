type ActionsVariablesTypes = 'string' | 'number' | 'boolean' | 'uuidV4'

type ActionsVariables = {
  type: ActionsVariablesTypes
  regex: RegExp
  description: string
  isGenerated?: boolean
}

type ActionsVariablesRecord = Record<ActionsVariablesTypes, ActionsVariables>

export const actionsVariables: ActionsVariablesRecord = {
  string: {
    type: 'string',
    regex: /"?\$s\$([a-zA-Z0-9_ -]+)\$"?/g,
    description: 'This will prompt you to enter a String when executing the Action'
  },
  number: {
    type: 'number',
    regex: /"?\$n\$([a-zA-Z0-9_ -]+)\$"?/g,
    description: 'This will prompt you to enter a Number when executing the Action'
  },
  boolean: {
    type: 'boolean',
    regex: /"?\$b\$([a-zA-Z0-9_ -]+)\$"?/g,
    description: 'This will prompt you to enter a Boolean when executing the Action'
  },
  uuidV4: {
    type: 'uuidV4',
    regex: /"?\$uuid\$v4\$"?/g,
    description: 'This will generate a UUID v4 when executing the Action',
    isGenerated: true
  }
}

export const actionsVariablesArray = Object.values(actionsVariables)

export const getPayloadVariablesGrouped = (payload: string) => {
  return actionsVariablesArray
    .filter((item) => !item.isGenerated)
    .map((item) => {
      return {
        type: item.type,
        variables: [...payload.matchAll(item.regex)]
          .map((item) => ({
            index: item.index,
            full: item[0],
            name: item[1]
          }))
          .flat()
      }
    })
}

export const getPayloadVariablesCount = (payload: string) => {
  return getPayloadVariablesGrouped(payload)
    .map((item) => item.variables)
    .flat().length
}
