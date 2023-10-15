import { useSettingsStore } from './settings-store'
import { codeType } from '../assets/js/format-code'
import { v4 as uuidV4 } from 'uuid'
import { defineStore } from 'pinia'

export type MqttMessage = {
  uid: string
  qos: 0 | 1 | 2
  message: string
  dataType?: 'json' | 'xml' | 'raw'
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
    subTopicsTopicsCount: {} as Record<string, Record<string, number>>,
    subTopicsMessagesCount: {} as Record<string, Record<string, number>>,
    topicsStructure: {} as Record<string, MqttTopicStructure>,
    selectedConnection: '',
    selectedTopic: '',
    topicsPublishMessages: {} as Record<string, Record<string, MqttMessage[]>>,
    selectedPublishTopic: '',
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
    getSubTopicsTopicsCount: (state) => (clientKey: string, topic: string) => {
      return state.subTopicsTopicsCount[clientKey]?.[topic] || 0
    },
    getSubTopicsMessagesCount: (state) => (clientKey: string, topic: string) => {
      return state.subTopicsMessagesCount[clientKey]?.[topic] || 0
    },
    getSelectedTopicMessages(): MqttMessage[] {
      const connectionTopics = this.topicsMessages[this.selectedConnection]

      if (!connectionTopics) return []

      return (connectionTopics[this.selectedTopic] || []).reverse()
    },
    getSelectedPublishTopicMessages(): MqttMessage[] {
      const connectionTopics = this.topicsPublishMessages[this.selectedConnection]

      if (!connectionTopics) return []

      return (connectionTopics[this.selectedPublishTopic] || []).reverse()
    },
    sortedSelectedTopicMessages(): MqttMessage[] {
      return this.getSelectedTopicMessages.slice().sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
    },
    sortedSelectedPublishTopicMessages(): MqttMessage[] {
      return this.getSelectedPublishTopicMessages.slice().sort((a, b) => {
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
    },
    getFilteredTopicsList: (state) => (clientKey: string) => {
      return Object.keys(state.topicsMessages[clientKey] || {}).filter((topic) => {
        return topic.includes(state.topicSearch)
      })
    },
    getFilteredTopicsStructure:
      (state) =>
      (clientKey: string): MqttTopicStructure => {
        const topicStructure = state.topicsStructure[clientKey] || {}

        if (!state.topicSearch) return topicStructure

        const filterTopicStructure = (topicStructure: MqttTopicStructure): MqttTopicStructure => {
          const filteredTopicStructure: MqttTopicStructure = {}

          for (const topicKey in topicStructure) {
            if (topicKey.toLowerCase().includes(state.topicSearch.toLowerCase())) {
              filteredTopicStructure[topicKey] = topicStructure[topicKey]
            } else {
              const subTopicStructure = filterTopicStructure(topicStructure[topicKey] || {})

              if (Object.keys(subTopicStructure).length) {
                filteredTopicStructure[topicKey] = subTopicStructure
              }
            }
          }

          return filteredTopicStructure
        }

        return filterTopicStructure(topicStructure)
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

      let topicExists = this.topicsMessages[clientKey][topic]

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
        dataType: codeType(message),
        retained: extras.retained || false,
        createdAt: new Date()
      } as MqttMessage

      this.topicsMessages[clientKey][topic].push(mqttMessage)
      this.topicsLastMessage[clientKey][topic] = mqttMessage

      ///////////
      // Removing old messages when the limit is reached
      const amountMessagesToRemove =
        this.topicsMessages[clientKey][topic].length - settingsStore.maxMessages + 1

      if (amountMessagesToRemove > 1) {
        this.topicsMessages[clientKey][topic].splice(0, amountMessagesToRemove)
      }

      const topicParts = topic.split('/')

      ///////////
      // Increasing subtopics messages count
      let currentTopicPath = ''

      if (!this.subTopicsMessagesCount[clientKey]) this.subTopicsMessagesCount[clientKey] = {}

      for (const topicPart of topicParts) {
        currentTopicPath += `${topicPart}`

        if (!this.subTopicsMessagesCount[clientKey][currentTopicPath]) {
          this.subTopicsMessagesCount[clientKey][currentTopicPath] = 1
        } else this.subTopicsMessagesCount[clientKey][currentTopicPath] += 1

        currentTopicPath += `/`
      }

      if (topicExists) return

      ///////////
      // Creating Topic structure cache
      if (!this.topicsStructure[clientKey]) this.topicsStructure[clientKey] = {}
      if (!this.subTopicsTopicsCount[clientKey]) this.subTopicsTopicsCount[clientKey] = {}

      let currentTopicStructure = this.topicsStructure[clientKey]
      currentTopicPath = ''

      for (const topicPart of topicParts) {
        currentTopicPath += `${topicPart}`

        if (!currentTopicStructure[topicPart]) currentTopicStructure[topicPart] = {}

        currentTopicStructure = currentTopicStructure[topicPart] || {}

        if (!this.subTopicsTopicsCount[clientKey][currentTopicPath]) {
          this.subTopicsTopicsCount[clientKey][currentTopicPath] = 1
        } else this.subTopicsTopicsCount[clientKey][currentTopicPath] += 1

        currentTopicPath += `/`
      }
    },
    addPublishMessage(
      clientKey: string,
      topic: string,
      message: string,
      extras: { qos: MqttMessage['qos']; retained?: boolean }
    ) {
      if (!this.topicsPublishMessages[clientKey]) this.topicsPublishMessages[clientKey] = {}
      if (!this.topicsPublishMessages[clientKey][topic])
        this.topicsPublishMessages[clientKey][topic] = []

      const mqttMessage = {
        uid: uuidV4(),
        message,
        qos: extras.qos,
        retained: extras.retained || false,
        createdAt: new Date()
      }

      this.topicsPublishMessages[clientKey][topic].push(mqttMessage)
    },
    clearConnectionMessages(clientKey: string) {
      this.topicsMessages[clientKey] = {}
      this.topicsLastMessage[clientKey] = {}
      this.subTopicsTopicsCount[clientKey] = {}
      this.subTopicsMessagesCount[clientKey] = {}
      this.topicsStructure[clientKey] = {}
    },
    clearTopicsAndSubTopicsMessages(clientKey: string, topic: string) {
      const topics = Object.keys(this.topicsMessages[clientKey]).filter((filterTopic) => {
        return filterTopic.startsWith(topic)
      })

      for (const topic of topics) {
        delete this.topicsMessages[clientKey][topic]
        delete this.topicsLastMessage[clientKey][topic]
        delete this.subTopicsTopicsCount[clientKey][topic]
        delete this.subTopicsMessagesCount[clientKey][topic]
      }

      this.clearTopicsAndSubTopicsStructure(clientKey, topic)
    },
    clearTopicsAndSubTopicsStructure(clientKey: string, topic: string) {
      const topicParts = topic.split('/')

      let currentTopicStructure = this.topicsStructure[clientKey]

      for (const [index, topicPart] of topicParts.entries()) {
        if (index === topicParts.length - 1) {
          delete currentTopicStructure[topicPart]
          break
        } else {
          currentTopicStructure = currentTopicStructure[topicPart] || {}
        }
      }
    },
    setSelectedTopic(clientKey: string, topic: string) {
      this.selectedConnection = clientKey
      this.selectedTopic = topic

      this.setSelectedPublishTopic(topic)
    },
    setSelectedPublishTopic(topic: string) {
      this.selectedPublishTopic = topic
    },
    setTopicSearch(topicSearch: string) {
      this.topicSearch = topicSearch
    }
  }
})
