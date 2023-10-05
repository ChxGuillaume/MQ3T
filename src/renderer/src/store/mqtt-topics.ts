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

type MqttTopicStructure = {
  [key: string]: MqttTopicStructure | null
}

export const useMqttTopicsStore = defineStore('mqtt-topics', {
  state: () => ({
    topicsMessages: {} as Record<string, Record<string, MqttMessage[]>>,
    subTopicsMessagesCount: {} as Record<string, Record<string, number>>,
    topicsStructure: {} as Record<string, MqttTopicStructure>,
    selectedConnection: '',
    selectedTopic: '',
    topicSearch: ''
  }),
  getters: {
    getSubtopicsCount: (state) => (clientKey: string, subTopic: string) => {
      const topicList = Object.keys(state.topicsMessages[clientKey] || {})

      if (!topicList.length) return 0

      return topicList.filter((topic) => topic.startsWith(subTopic)).length
    },
    getSubTopicsMessagesCount: (state) => (clientKey: string, topic: string) => {
      return state.subTopicsMessagesCount[clientKey]?.[topic] || 0
    },
    getSelectedTopicMessages(): MqttMessage[] {
      const connectionTopics = this.topicsMessages[this.selectedConnection]

      if (!connectionTopics) return []

      return (connectionTopics[this.selectedTopic] || []).reverse()
    },
    sortedSelectedTopicMessages(): MqttMessage[] {
      return this.getSelectedTopicMessages.slice().sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
    },
    getTopicLastMessage:
      (state) =>
      (clientKey: string, topic: string): MqttMessage | null => {
        const topicMessages = state.topicsMessages[clientKey]?.[topic]

        return topicMessages?.[topicMessages.length - 1] || null
      },
    getSelectedTopicLastMessage(): MqttMessage | undefined {
      return this.topicsMessages[this.selectedConnection]?.[this.selectedTopic]?.[0]
    }
  },
  actions: {
    addMessage(
      clientKey: string,
      topic: string,
      message: string,
      extras: { qos: MqttMessage['qos']; retained?: boolean }
    ) {
      if (!this.topicsMessages[clientKey]) this.topicsMessages[clientKey] = {}
      if (!this.topicsMessages[clientKey][topic]) this.topicsMessages[clientKey][topic] = []

      const settingsStore = useSettingsStore()

      this.topicsMessages[clientKey][topic].push({
        uid: uuidV4(),
        message,
        qos: extras.qos,
        retained: extras.retained || false,
        createdAt: new Date()
      })

      ///////////
      // Removing old messages when the limit is reached
      const amountMessagesToRemove =
        this.topicsMessages[clientKey][topic].length - settingsStore.maxMessages + 1

      if (amountMessagesToRemove > 1) {
        this.topicsMessages[clientKey][topic].splice(0, amountMessagesToRemove)
      }

      ///////////
      // Creating Topic structure cache
      if (!this.topicsStructure[clientKey]) this.topicsStructure[clientKey] = {}
      if (!this.subTopicsMessagesCount[clientKey]) this.subTopicsMessagesCount[clientKey] = {}

      const topicParts = topic.split('/')

      let currentTopicPath = ''
      let currentTopicStructure = this.topicsStructure[clientKey]

      for (const topicPart of topicParts) {
        if (!currentTopicStructure[topicPart]) currentTopicStructure[topicPart] = {}
        currentTopicPath += `${topicPart}`

        if (!this.subTopicsMessagesCount[clientKey][currentTopicPath]) {
          this.subTopicsMessagesCount[clientKey][currentTopicPath] = 1
        } else this.subTopicsMessagesCount[clientKey][currentTopicPath] += 1

        currentTopicStructure = currentTopicStructure[topicPart] || {}
        currentTopicPath += `/`
      }
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
