type ActionsVariablesTypes = 'string' | 'number' | 'boolean' | 'uuidV4'
type ActionsVariables = Record<
  ActionsVariablesTypes,
  {
    type: ActionsVariablesTypes
    regex: RegExp
    description: string
    isVariable?: boolean
  }
>

export const actionsVariables: ActionsVariables = {
  string: {
    type: 'string',
    regex: /"?\$s\$([a-zA-Z0-9_ -]+)\$"?/g,
    description: 'This will prompt you to enter a String when executing the Action',
    isVariable: true
  },
  number: {
    type: 'number',
    regex: /"?\$n\$([a-zA-Z0-9_ -]+)\$"?/g,
    description: 'This will prompt you to enter a Number when executing the Action',
    isVariable: true
  },
  boolean: {
    type: 'boolean',
    regex: /"?\$b\$([a-zA-Z0-9_ -]+)\$"?/g,
    description: 'This will prompt you to enter a Boolean when executing the Action',
    isVariable: true
  },
  uuidV4: {
    type: 'uuidV4',
    regex: /"?\$uuid\$v4\$"?/g,
    description: 'This will generate a UUID v4 when executing the Action'
  }
}

export const actionsVariablesArray = Object.values(actionsVariables)

export const getPayloadVariablesGrouped = (payload: string) => {
  return actionsVariablesArray
    .filter((item) => item.isVariable)
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
