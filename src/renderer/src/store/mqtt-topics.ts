import { defineStore } from 'pinia'

type MqttMessage = {
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
    selectedTopic: ''
  }),
  getters: {
    getSelectedTopicMessages(): MqttMessage[] {
      const connectionTopics = this.topics[this.selectedConnection]

      if (!connectionTopics) return []

      return (connectionTopics[this.selectedTopic] || []).reverse()
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
      const [clientKey, ...topicParts] = topic.split('/')

      this.selectedConnection = clientKey
      this.selectedTopic = topicParts.join('/')

      console.log(this.selectedConnection, this.selectedTopic)
    }
  }
})
