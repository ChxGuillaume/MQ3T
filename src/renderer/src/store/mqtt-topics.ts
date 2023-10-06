import { useSettingsStore } from './settings-store'
import { v4 as uuidV4 } from 'uuid'
import { defineStore } from 'pinia'

type MqttMessage = {
  uid: string
  qos: 0 | 1 | 2
  message: string
  retained: boolean
  createdDiff?: number
  createdAt: Date
}

export type MqttTopicStructure = {
  [key: string]: MqttTopicStructure | null
}

// type MqttTopicsStructureTest = {
//   opened: boolean
//   structure: {
//     [key: string]: MqttTopicsStructureTest
//   }
// }

export const useMqttTopicsStore = defineStore('mqtt-topics', {
  state: () => ({
    topicsMessages: {} as Record<string, Record<string, MqttMessage[]>>,
    topicsLastMessage: {} as Record<string, Record<string, MqttMessage>>,
    subTopicsMessagesCount: {} as Record<string, Record<string, number>>,
    topicsStructure: {} as Record<string, MqttTopicStructure>,
    selectedConnection: '',
    selectedTopic: '',
    topicSearch: ''
  }),
  getters: {
    getClientKeyList: (state) => {
      return Object.keys(state.topicsMessages)
    },
    getConnectionTopicsStructure:
      (state) =>
      (clientKey: string): MqttTopicStructure => {
        return state.topicsStructure[clientKey] || {}
      },
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
        return state.topicsLastMessage[clientKey]?.[topic] || null
      },
    getSelectedTopicLastMessage(): MqttMessage | undefined {
      return this.topicsLastMessage[this.selectedConnection]?.[this.selectedTopic]
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
      if (!this.topicsLastMessage[clientKey]) this.topicsLastMessage[clientKey] = {}

      const settingsStore = useSettingsStore()
      const lastMessage = this.topicsLastMessage[clientKey][topic]

      if (lastMessage)
        lastMessage.createdDiff = lastMessage?.createdAt.getTime() - new Date().getTime()

      const mqttMessage = {
        uid: uuidV4(),
        message,
        qos: extras.qos,
        retained: extras.retained || false,
        createdAt: new Date()
      }

      this.topicsMessages[clientKey][topic].push(mqttMessage)
      this.topicsLastMessage[clientKey][topic] = mqttMessage

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
    setSelectedTopic(clientKey: string, topic: string) {
      this.selectedConnection = clientKey
      this.selectedTopic = topic
    },
    setTopicSearch(topicSearch: string) {
      this.topicSearch = topicSearch
    }
  }
})
