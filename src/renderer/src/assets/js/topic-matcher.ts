export const topicMatchesSlicedWildcards = (topic: string, wildcards: string[]): string[] => {
  let matchingWildcards = wildcards.filter((wildcard) => {
    let regexTopic = wildcard
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
  let matchingTopics = topics.filter((topic) => {
    let regexTopic = wildcard
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
  let regexTopic = wildcard.replace(/\\/g, '\\\\').replace(/\+/g, '.+?').replace(/\//g, '\\/')

  return topics.filter((topic) => new RegExp(regexTopic).test(topic))
}
