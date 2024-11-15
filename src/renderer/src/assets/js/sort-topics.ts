export const sortTopics = (a: string, b: string) => {
  const aParts = a.split('/')
  const bParts = b.split('/')

  const length = Math.max(aParts.length, bParts.length)

  for (let i = 0; i < length; i++) {
    if (aParts[i] === undefined && bParts[i] === undefined) return 0
    else if (aParts[i] === undefined) return -1
    else if (bParts[i] === undefined) return 1

    const aPart = aParts[i] || ''
    const bPart = bParts[i] || ''

    if (aPart === bPart) continue

    const aIsNumber = !isNaN(Number(aPart))
    const bIsNumber = !isNaN(Number(bPart))

    if (aIsNumber && bIsNumber) return Number(aPart) - Number(bPart)
    else if (aIsNumber) return -1
    else if (bIsNumber) return 1
    else return aPart.localeCompare(bPart)
  }

  return 0
}
