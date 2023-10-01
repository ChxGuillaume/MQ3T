import { defineStore } from 'pinia'

type MqttMessage = {
  message: string
  qos: 0 | 1 | 2
  retained: boolean
  createdAt: Date
}

export const useMqttTopicsStore = defineStore('mqtt-topics', {
  state: () => ({
    topics: {} as Record<string, Record<string, MqttMessage[]>>,
    topicsStructure: {} as Record<string, Record<string, any>>,
    selectedTopic: ''
  }),
  getters: {
    getSelectedTopicMessages(): MqttMessage[] {
      const [clientKey, ...topicParts] = this.selectedTopic.split('/')

      const connectionTopics = this.topics[clientKey]

      if (!connectionTopics) return []

      return connectionTopics[topicParts.join('/')] || []
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

      this.topics[clientKey][topic].push({
        message,
        qos: extras.qos,
        retained: extras.retained || false,
        createdAt: new Date()
      })

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
      this.selectedTopic = topic
    }
  }
})
