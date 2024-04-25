export type GlyphLine = {
  lineNumber: number
  path: string
}

// I love how this is perfectly readable, or not?
export const parseJsonForGlyphs = (value: string): GlyphLine[] => {
  const splitValue = value.split('\n')
  const linesNumbers: GlyphLine[] = []
  const contextPath: ('object' | 'array')[] = []
  const currentPath: string[] = []
  const arrayIndex: Record<string, number> = {}

  splitValue.forEach((line, index) => {
    let trimmedLine = trimLine(line)
    const [key, value] = trimmedLine.replace(/"/g, '').split(':')
    const isKeyValueLine = trimmedLine.includes(':')
    const endsWithOpenBracket = trimmedLine.endsWith('{')
    const endsWithCloseBracket = trimmedLine.endsWith('}')
    const endsWithOpenSquareBracket = trimmedLine.endsWith('[')
    const endsWithCloseSquareBracket = trimmedLine.endsWith(']')

    const currentContext = contextPath[contextPath.length - 1]

    if (isKeyValueLine) {
      if (endsWithOpenBracket) {
        currentPath.push(key)
      } else if (endsWithOpenSquareBracket) {
        currentPath.push(key)
        arrayIndex[currentPath.join('.')] = 0
      } else {
        currentPath.push(key)
      }
    } else {
      if (endsWithOpenBracket) {
        if (currentContext === 'array') currentPath.push(`[${arrayIndex[currentPath.join('.')]++}]`)
      } else if (endsWithOpenSquareBracket) {
        arrayIndex[currentPath.join('.')] = 0
      } else if (endsWithCloseBracket) {
        currentPath.pop()
      } else if (endsWithCloseSquareBracket) {
        currentPath.pop()
      } else {
        if (currentContext === 'array') currentPath.push(`[${arrayIndex[currentPath.join('.')]++}]`)
      }
    }

    // Update Context
    if (endsWithOpenBracket) contextPath.push('object')
    else if (endsWithOpenSquareBracket) contextPath.push('array')
    else if (endsWithCloseBracket || endsWithCloseSquareBracket) contextPath.pop()

    let valueToTest = trimmedLine.trim()
    if (isKeyValueLine) valueToTest = value.trim()

    if (!isNaN(Number(valueToTest.trim()))) {
      linesNumbers.push({ lineNumber: index + 1, path: currentPath.join('.') })
    }

    if (isKeyValueLine && !endsWithOpenBracket && !endsWithOpenSquareBracket) currentPath.pop()
    else if (
      !isKeyValueLine &&
      !endsWithOpenBracket &&
      !endsWithOpenSquareBracket &&
      !endsWithCloseBracket &&
      !endsWithCloseSquareBracket &&
      currentContext === 'array'
    ) {
      currentPath.pop()
    }
  })

  return linesNumbers
}

const trimLine = (line: string): string => {
  const trimmedLine = line.trim()
  if (trimmedLine.endsWith(',')) return trimmedLine.slice(0, -1)
  return trimmedLine
}

export const getDataFromPath = (data: any, path: string): number | null => {
  if (path === '' && !isNaN(data)) return data

  const pathParts = path.replace(/[\[\]]/g, '').split('.')
  let result = data

  for (const part of pathParts) {
    if (!result[part]) return null
    result = result[part]
  }

  return result
}
