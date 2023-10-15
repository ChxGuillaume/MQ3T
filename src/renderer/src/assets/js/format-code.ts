import xmlFormat from 'xml-formatter'

export const formatJson = (message: string) => {
  try {
    return JSON.stringify(JSON.parse(message), null, 4)
  } catch (e) {
    return message
  }
}

export const formatXml = (message: string) => {
  try {
    return xmlFormat(message, {
      indentation: '    ',
      collapseContent: true
    })
  } catch (e) {
    return message
  }
}

export const formatCode = (message: string, contentType: 'json' | 'xml' | string) => {
  switch (contentType) {
    case 'json':
      return formatJson(message)
    case 'xml':
      return formatXml(message)
  }

  return message
}

export const validJson = (message: string): boolean => {
  try {
    JSON.parse(message)
    return true
  } catch (e) {
    return false
  }
}

export const validXml = (message: string): boolean => {
  try {
    xmlFormat(message, {
      indentation: '    ',
      strictMode: true
    })
    console.log('test')
    return true
  } catch (e) {
    return false
  }
}

export const validCode = (message: string, contentType: 'json' | 'xml' | string) => {
  switch (contentType) {
    case 'json':
      return validJson(message)
    case 'xml':
      return validXml(message)
  }

  return true
}

export const codeType = (message: string): 'json' | 'xml' | 'raw' => {
  if (validJson(message)) return 'json'
  if (validXml(message)) return 'xml'

  return 'raw'
}
