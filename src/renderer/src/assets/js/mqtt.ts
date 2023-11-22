export const matchTopics = (topic1: string, topic2: string): boolean => {
  const topic1Parts = topic1.split('/')
  const topic2Parts = topic2.split('/')

  for (let i = 0; i < Math.max(topic1Parts.length, topic2Parts.length); i++) {
    if (!topic1Parts[i] || !topic2Parts[i]) return false
    if (topic1Parts[i] === topic2Parts[i]) continue
    if (topic1Parts[i] === '#' || topic2Parts[i] === '#') return true
    if (topic1Parts[i] === '+' || topic2Parts[i] === '+') continue

    return false
  }

  return true
}
