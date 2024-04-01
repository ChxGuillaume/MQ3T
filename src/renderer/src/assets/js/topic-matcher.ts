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

export const wildcardMatchesTopics = (wildcard: string, topics: string[]): string[] => {
  return topics.filter((topic) => {
    let regexTopic = wildcard.replace(/\+/g, '.+?').replace(/\//g, '\\/')

    return new RegExp(regexTopic).test(topic)
  })
}
