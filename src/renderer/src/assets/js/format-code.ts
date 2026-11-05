import { parse, stringify } from 'yaml'
import xmlFormat from 'xml-formatter'

export const formatJson = (message: string) => {
  try {
    return JSON.stringify(JSON.parse(message), null, 4)
  } catch {
    return message
  }
}

export const formatXml = (message: string) => {
  try {
    return xmlFormat(message, {
      indentation: '    ',
      collapseContent: true
    })
  } catch {
    return message
  }
}

export const formatYaml = (message: string) => {
  try {
    return stringify(parse(message), {
      indent: 4
    })
  } catch {
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
  } catch {
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
  } catch {
    return false
  }
}

export const validYaml = (message: string): boolean => {
  try {
    return !validJson(message) && parse(message) !== null
  } catch {
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

export type CodeError = { message: string; line: number; column: number }

const offsetToLineColumn = (text: string, offset: number) => {
  const before = text.slice(0, offset).split('\n')

  return { line: before.length, column: before[before.length - 1].length + 1 }
}

const jsonError = (message: string): CodeError | null => {
  try {
    JSON.parse(message)
    return null
  } catch (error) {
    const text = (error as Error).message
    const lineColumn = text.match(/\(line (\d+) column (\d+)\)/)
    const position = text.match(/at position (\d+)/)

    const location = lineColumn
      ? { line: Number(lineColumn[1]), column: Number(lineColumn[2]) }
      : position
        ? offsetToLineColumn(message, Number(position[1]))
        : /end of JSON/.test(text)
          ? offsetToLineColumn(message, message.trimEnd().length)
          : { line: 1, column: 1 }

    return {
      message: text.replace(/\s*(in JSON )?at position \d+(\s*\(line \d+ column \d+\))?$/, ''),
      ...location
    }
  }
}

const xmlError = (message: string): CodeError | null => {
  if (validXml(message)) return null

  const parsed = new DOMParser().parseFromString(message, 'application/xml')
  const details = parsed
    .querySelector('parsererror')
    ?.textContent?.match(/error on line (\d+) at column (\d+): ([^\n]+)/)

  if (!details) return { message: 'Invalid XML', line: 1, column: 1 }

  return { message: details[3].trim(), line: Number(details[1]), column: Number(details[2]) }
}

const yamlError = (message: string): CodeError | null => {
  try {
    parse(message)
    return null
  } catch (error) {
    const yamlParseError = error as Error & { linePos?: { line: number; col: number }[] }
    const position = yamlParseError.linePos?.[0]

    return {
      message: yamlParseError.message.split('\n')[0].replace(/ at line \d+, column \d+:?$/, ''),
      line: position?.line ?? 1,
      column: position?.col ?? 1
    }
  }
}

export const findCodeError = (message: string, contentType: string): CodeError | null => {
  if (!message.trim()) return null

  switch (contentType) {
    case 'json':
      return jsonError(message)
    case 'xml':
      return xmlError(message)
    case 'yaml':
      return yamlError(message)
  }

  return null
}
