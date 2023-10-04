import { useSettingsStore } from './settings-store'
import { v4 as uuidV4 } from 'uuid'
import { defineStore } from 'pinia'

type MqttMessage = {
  uid: string
  qos: 0 | 1 | 2
  message: string
  retained: boolean
  createdAt: Date
}

export const useMqttTopicsStore = defineStore('mqtt-topics', {
  state: () => ({
    topics: {} as Record<string, Record<string, MqttMessage[]>>,
    topicsStructure: {} as Record<string, Record<string, any>>,
    selectedConnection: '',
    selectedTopic: '',
    topicSearch: ''
  }),
  getters: {
    getSelectedTopicMessages(): MqttMessage[] {
      const connectionTopics = this.topics[this.selectedConnection]

      if (!connectionTopics) return []

      return (connectionTopics[this.selectedTopic] || []).reverse()
    },
    sortedSelectedTopicMessages(): MqttMessage[] {
      return this.getSelectedTopicMessages.slice().sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
    },
    getSelectedTopicLastMessage(): MqttMessage | undefined {
      return this.topics[this.selectedConnection]?.[this.selectedTopic]?.[0]
    }
  },
  actions: {
    addMessage(
      clientKey: string,
      topic: string,
      message: string,
      extras: { qos: MqttMessage['qos']; retained?: boolean }
    ) {
      if (!this.topics[clientKey]) this.topics[clientKey] = {}
      if (!this.topics[clientKey][topic]) this.topics[clientKey][topic] = []

      const settingsStore = useSettingsStore()

      this.topics[clientKey][topic].push({
        uid: uuidV4(),
        message,
        qos: extras.qos,
        retained: extras.retained || false,
        createdAt: new Date()
      })

      ///////////
      // Removing old messages when the limit is reached
      const amountMessagesToRemove =
        this.topics[clientKey][topic].length - settingsStore.maxMessages + 1

      if (amountMessagesToRemove > 1) {
        this.topics[clientKey][topic].splice(0, amountMessagesToRemove)
      }

      ///////////
      // Creating Topic structure cache
      if (!this.topicsStructure[clientKey]) this.topicsStructure[clientKey] = {}

      const topicParts = topic.split('/')

      let currentTopicStructure = this.topicsStructure[clientKey]

      topicParts.forEach((topicPart, index) => {
        const lastPart = index === topicParts.length - 1

        if (!currentTopicStructure[topicPart]) currentTopicStructure[topicPart] = {}

        if (lastPart) {
          if (!currentTopicStructure[topicPart]) currentTopicStructure[topicPart] = {}
        }

        currentTopicStructure = currentTopicStructure[topicPart]
      })
    },
    setSelectedTopic(topic: string) {
      const [clientKey, ...topicParts] = topic.split('/')

      this.selectedConnection = clientKey
      this.selectedTopic = topicParts.join('/')
    },
    setTopicSearch(topicSearch: string) {
      this.topicSearch = topicSearch
    }
  }
})
