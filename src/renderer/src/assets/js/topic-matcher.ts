export const topicMatchesSlicedWildcards = (topic: string, wildcards: string[]): string[] => {
  const matchingWildcards = wildcards.filter((wildcard) => {
    const regexTopic = wildcard
      .slice(0, wildcard.lastIndexOf('+') + 2)
      .replace(/\+/g, '.+?')
      .replace(/\//g, '\\/')

    return new RegExp(regexTopic).test(topic)
  })

  return matchingWildcards.map((wildcard) => {
    const splitWildcard = wildcard.split('/')
    const splitTopic = topic.split('/')

    return splitWildcard
      .map((part, index) => {
        return part === '+' ? splitTopic[index] : part
      })
      .join('/')
  })
}

export const slicedWildcardMatchesTopics = (wildcard: string, topics: string[]): string[] => {
  const matchingTopics = topics.filter((topic) => {
    const regexTopic = wildcard
      .slice(0, wildcard.lastIndexOf('+') + 2)
      .replace(/\+/g, '.+?')
      .replace(/\//g, '\\/')

    return new RegExp(regexTopic).test(topic)
  })

  const transformedTopics = matchingTopics.map((topic) => {
    const splitWildcard = wildcard.split('/')
    const splitTopic = topic.split('/')

    return splitWildcard
      .map((part, index) => {
        return part === '+' ? splitTopic[index] : part
      })
      .join('/')
  })

  return Array.from(new Set(transformedTopics))
}

export const wildcardMatchesTopics = (wildcard: string, topics: string[]): string[] => {
  return topics.filter((topic) => {
    const regexTopic = wildcard.replace(/\+/g, '.+?').replace(/\//g, '\\/')

    return new RegExp(regexTopic).test(topic)
  })
}
