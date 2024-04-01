import { useMqttTopicsStore } from './mqtt-topics'
import { defineStore } from 'pinia'

export const useActionsCacheStore = defineStore('actionsCache', {
  state: () => ({
    topics: {} as Record<string, Record<string, true>>,
    wildcardTopics: {} as Record<string, Record<string, true>>
  }),
  actions: {
    addTopic(connectionId: string, topic: string) {
      const mqttTopicsStore = useMqttTopicsStore()

      if (!this.topics[connectionId]) this.topics[connectionId] = {}

      this.topics[connectionId][topic] = true

      mqttTopicsStore.addTopicToStructure(connectionId, topic)
    },
    removeTopic(connectionId: string, topic: string) {
      if (!this.topics[connectionId]) return

      delete this.topics[connectionId][topic]
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
