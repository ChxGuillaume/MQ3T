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
