import { parse, stringify } from 'yaml'
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

export const formatYaml = (message: string) => {
  try {
    return stringify(parse(message), {
      indent: 4
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
    return true
  } catch (e) {
    return false
  }
}

export const validYaml = (message: string): boolean => {
  try {
    return !validJson(message) && parse(message) !== null
  } catch (e) {
    return false
  }
}

export const validCode = (message: string, contentType: 'json' | 'xml' | 'yaml' | string) => {
  switch (contentType) {
    case 'json':
      return validJson(message)
    case 'xml':
      return validXml(message)
    case 'yaml':
      return validYaml(message)
  }

  return true
}

export const codeType = (message: string): 'raw' | 'json' | 'xml' | 'yaml' => {
  if (validJson(message)) return 'json'
  // NOTE: XML is a valid YAML format, please keep XML before YAML validation
  if (validXml(message)) return 'xml'
  if (validYaml(message)) return 'yaml'

  return 'raw'
}
