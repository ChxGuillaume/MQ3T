const isNullOrUndefined = (value: any): boolean => [null, undefined].includes(value)

export const getDataFromPath = (data: any, path: string): number | null => {
  if (path === '' && !isNaN(data)) return data

  const pathParts = path.replace(/[[\]]/g, '').split('.')
  let result = data

  for (const part of pathParts) {
    if (isNullOrUndefined(result)) return null
    if (isNullOrUndefined(result[part])) return null

    result = result[part]
  }

  return result
}
