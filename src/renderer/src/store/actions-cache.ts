import { topicMatchesSlicedWildcards } from '../assets/js/topic-matcher'
import { useMqttTopicsStore } from './mqtt-topics'
import { defineStore } from 'pinia'

export const useActionsCacheStore = defineStore('actionsCache', {
  state: () => ({
    normalTopics: {} as Record<string, Record<string, true>>,
    wildcardTopics: {} as Record<string, Record<string, true>>
  }),
  getters: {
    getTopicsFromWildcard:
      (state) =>
      (connectionId: string, topic: string): string[] => {
        let wildcardTopics = Object.keys(state.wildcardTopics[connectionId]) || []

        return topicMatchesSlicedWildcards(topic, wildcardTopics)
      }
  },
  actions: {
    addTopic(connectionId: string, topic: string) {
      if (topic.includes('+')) this.addWildcardTopic(connectionId, topic)
      else this.addNormalTopic(connectionId, topic)
    },
    removeTopic(connectionId: string, topic: string) {
      // TODO:  quirk when deleting wildcard/normal
      //        should remove the normal topics only if no wildcard/normal matches
      if (topic.includes('+')) this.removeWildcardTopic(connectionId, topic)
      else this.removeNormalTopic(connectionId, topic)
    },
    addNormalTopic(connectionId: string, topic: string) {
      const mqttTopicsStore = useMqttTopicsStore()

      if (!this.normalTopics[connectionId]) this.normalTopics[connectionId] = {}

      this.normalTopics[connectionId][topic] = true

      mqttTopicsStore.addTopicToStructure(connectionId, topic)
    },
    removeNormalTopic(connectionId: string, topic: string) {
      if (!this.normalTopics[connectionId]) return

      delete this.normalTopics[connectionId][topic]
    },
    addWildcardTopic(connectionId: string, topic: string) {
      if (!this.wildcardTopics[connectionId]) this.wildcardTopics[connectionId] = {}

      this.wildcardTopics[connectionId][topic] = true
    },
    removeWildcardTopic(connectionId: string, topic: string) {
      if (!this.wildcardTopics[connectionId]) return

      delete this.wildcardTopics[connectionId][topic]
    }
  }
})
