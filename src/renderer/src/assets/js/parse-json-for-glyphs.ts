export type GlyphLine = {
  lineNumber: number
  path: string
}

// I love how this is perfectly readable, or not?
export const parseJsonForGlyphs = (value: string): GlyphLine[] => {
  const splitValue = value.split('\n')
  const linesNumbers: GlyphLine[] = []
  let currentPath: string[] = []
  let arrayIndex: Record<string, number> = {}
  let arrayPath: string[] = []

  splitValue.forEach((line, index) => {
    let trimmedLine = trimLine(line)

    if (trimmedLine.includes(':') && trimmedLine.endsWith('{')) {
      const [key, _] = trimmedLine.split(':')
      currentPath.push(key.trim().replace(/"/g, ''))
    } else if (trimmedLine.includes(':') && trimmedLine.endsWith('[')) {
      const [key, _] = trimmedLine.split(':')
      currentPath.pop()
      currentPath.push(key.trim().replace(/"/g, ''))
      arrayIndex[currentPath.join('.')] = 0
      arrayPath.push(key.trim())
    } else if (trimmedLine.includes(':')) {
      const [key, _] = trimmedLine.split(':')
      if (
        !trimLine(splitValue[index - 1]).endsWith('{') &&
        !trimLine(splitValue[index - 1]).endsWith(']')
      )
        currentPath.pop()
      currentPath.push(key.trim().replace(/"/g, ''))
    } else if (trimmedLine.endsWith('}')) {
      if (!trimLine(splitValue[index - 1]).endsWith(']')) currentPath.pop()
    } else if (trimmedLine.endsWith(']')) {
      currentPath.pop()
      currentPath.pop()
      arrayPath.pop()
    } else if (arrayPath.length) {
      if (!splitValue[index - 1].endsWith('[')) currentPath.pop()
      currentPath.push(`[${arrayIndex[currentPath.join('.')]++}]`)
    }

    let valueToTest = trimmedLine.trim()
    if (trimmedLine.includes(':')) valueToTest = trimmedLine.split(':')[1].trim()

    if (!isNaN(Number(valueToTest.trim()))) {
      linesNumbers.push({ lineNumber: index + 1, path: currentPath.join('.') })
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
