import { ElectronApi } from '../assets/js/electron-api'
import { useActionsCacheStore } from './actions-cache'
import { useSettingsStore } from './settings-store'
import { codeType } from '../assets/js/format-code'
import { IPublishPacket } from 'mqtt'
import { v4 as uuidV4 } from 'uuid'
import { defineStore } from 'pinia'
import _ from 'lodash'

export type MqttMessage = {
  uid: string
  qos: 0 | 1 | 2
  message: string
  dataType?: 'raw' | 'json' | 'xml' | 'yaml'
  retained: boolean
  createdDiff?: number
  createdAt: Date
}

export type MqttTopicStructure = {
  [key: string]: MqttTopicStructure | null
}

export type TopicMessages = Record<string, Record<string, MqttMessage[]>>

const filterBySearchTerms = (text: string, searchTerms: string): boolean => {
  return searchTerms
    .trim()
    .toLowerCase()
    .split(' ')
    .some((keyword) => text.toLowerCase().includes(keyword))
}

export const useMqttTopicsStore = defineStore('mqtt-topics', {
  state: () => ({
    topicsMessages: {} as TopicMessages,
    topicsLastMessage: {} as Record<string, Record<string, MqttMessage>>,
    subTopicsTopicsCount: {} as Record<string, Record<string, number>>,
    subTopicsMessagesCount: {} as Record<string, Record<string, number>>,
    topicsStructure: {} as Record<string, MqttTopicStructure>,
    topicGroupOpened: {} as Record<string, Record<string, boolean>>,
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
    getConnectionTopics:
      (state) =>
      (clientKey: string): string[] => {
        return Object.keys(state.topicsMessages[clientKey] || {})
      },
    getSubTopicsTopicsCount: (state) => (clientKey: string, topic: string) => {
      return state.subTopicsTopicsCount[clientKey]?.[topic] || 0
    },
    getSubTopicsMessagesCount: (state) => (clientKey: string, topic: string) => {
      return state.subTopicsMessagesCount[clientKey]?.[topic] || 0
    },
    getTopicMessages:
      (state) =>
      (clientKey: string, topic: string): MqttMessage[] => {
        return state.topicsMessages[clientKey]?.[topic] || []
      },
    getSelectedTopicMessages(): MqttMessage[] {
      const connectionTopics = this.topicsMessages[this.selectedConnection]

      if (!connectionTopics) return []

      return (connectionTopics[this.selectedTopic] || []).slice().reverse()
    },
    getSelectedPublishTopicMessages(): MqttMessage[] {
      const connectionTopics = this.topicsPublishMessages[this.selectedConnection]

      if (!connectionTopics) return []

      return (connectionTopics[this.selectedPublishTopic] || []).slice().reverse()
    },
    sortedTopicMessages:
      (state) =>
      (clientKey: string, topic: string): MqttMessage[] => {
        return (
          state.topicsMessages[clientKey]?.[topic]?.slice().sort((a, b) => {
            return b.createdAt.getTime() - a.createdAt.getTime()
          }) || []
        )
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
    getTopicGroupOpened: (state) => (clientKey: string, topic: string) => {
      return state.topicGroupOpened[clientKey]?.[topic] || false
    },
    getAllTopicList: (state) => (clientKey: string) => {
      const topic = Object.assign({}, state.topicsMessages[clientKey])

      // for each topic, add the subtopics
      // example, if we have a topic like "a/b/c", we need to add "a" and "a/b" to the list
      for (const topicKey in topic) {
        const topicParts = topicKey.split('/')

        let currentTopicPath = ''

        for (const topicPart of topicParts) {
          currentTopicPath += `${topicPart}`

          if (!topic[currentTopicPath]) topic[currentTopicPath] = []

          currentTopicPath += `/`
        }
      }

      return Object.keys(topic)
    },
    topicHasSubTopics: (state) => (clientKey: string, topic: string) => {
      return Object.keys(state.topicsMessages[clientKey] || {}).some((subTopic) => {
        return subTopic.startsWith(topic + '/')
      })
    },
    getFilteredTopicsList: (state) => (clientKey: string) => {
      return Object.keys(state.topicsMessages[clientKey] || {}).filter((topic) => {
        return filterBySearchTerms(topic, state.topicSearch)
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
            if (filterBySearchTerms(topicKey, state.topicSearch)) {
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
    initStore() {
      ElectronApi.handleTransferMqttMessages((__, messages) => {
        // Dates arrive as string, need to be transformed to
        this.topicsMessages = _.mapValues(messages, (clientTopics) =>
          _.mapValues(clientTopics, (msgs) =>
            _.map(msgs, (msg) => ({ ...msg, createdAt: new Date(msg.createdAt) }))
          )
        )
      })
    },
    addMessage(clientKey: string, topic: string, message: string, packet: IPublishPacket) {
      const actionsCacheStore = useActionsCacheStore()
      const settingsStore = useSettingsStore()

      if (!this.topicsMessages[clientKey]) this.topicsMessages[clientKey] = {}

      const topicExists = this.topicsMessages[clientKey][topic]

      if (!this.topicsMessages[clientKey][topic]) this.topicsMessages[clientKey][topic] = []
      if (!this.topicsLastMessage[clientKey]) this.topicsLastMessage[clientKey] = {}

      const lastMessage = this.topicsLastMessage[clientKey][topic]

      if (lastMessage)
        lastMessage.createdDiff = lastMessage?.createdAt.getTime() - new Date().getTime()

      const mqttMessage = {
        uid: uuidV4(),
        message,
        qos: packet.qos,
        dataType: codeType(message),
        retained: packet.retain || false,
        createdAt: new Date()
      } as MqttMessage

      this.topicsMessages[clientKey][topic].push(mqttMessage)
      this.topicsLastMessage[clientKey][topic] = mqttMessage

      ///////////
      // Removing old messages when the limit is reached
      const amountMessagesToRemove =
        this.topicsMessages[clientKey][topic].length - settingsStore.maxMessages + 1

      if (amountMessagesToRemove > 1) {
        this.topicsMessages[clientKey][topic].sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        )

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
      // Increasing subtopics  count
      if (!this.subTopicsTopicsCount[clientKey]) this.subTopicsTopicsCount[clientKey] = {}
      currentTopicPath = ''

      for (const topicPart of topicParts) {
        currentTopicPath += `${topicPart}`

        if (!this.subTopicsTopicsCount[clientKey][currentTopicPath]) {
          this.subTopicsTopicsCount[clientKey][currentTopicPath] = 1
        } else this.subTopicsTopicsCount[clientKey][currentTopicPath] += 1

        currentTopicPath += `/`
      }

      this.addTopicToStructure(clientKey, topic)

      actionsCacheStore.getTopicsFromWildcard(clientKey, topic).forEach((wildcardTopic) => {
        actionsCacheStore.addNormalTopic(clientKey, wildcardTopic)
      })
    },
    addTopicToStructure(clientKey: string, topic: string) {
      if (!this.topicsStructure[clientKey]) this.topicsStructure[clientKey] = {}

      let currentTopicStructure = this.topicsStructure[clientKey]
      const topicParts = topic.split('/')

      for (const topicPart of topicParts) {
        if (!currentTopicStructure[topicPart]) currentTopicStructure[topicPart] = {}

        currentTopicStructure = currentTopicStructure[topicPart] || {}
      }
    },
    addPublishMessage(
      clientKey: string,
      topic: string,
      message: string,
      extras: { qos?: MqttMessage['qos']; dataType?: MqttMessage['dataType']; retained?: boolean }
    ) {
      if (!this.topicsPublishMessages[clientKey]) this.topicsPublishMessages[clientKey] = {}
      if (!this.topicsPublishMessages[clientKey][topic])
        this.topicsPublishMessages[clientKey][topic] = []

      const mqttMessage = {
        uid: uuidV4(),
        message,
        qos: extras.qos || 0,
        dataType: extras.dataType || 'raw',
        retained: extras.retained || false,
        createdAt: new Date()
      } as MqttMessage

      this.topicsPublishMessages[clientKey][topic].push(mqttMessage)
    },
    clearConnectionMessages(clientKey: string) {
      this.topicsMessages[clientKey] = {}
      this.topicsLastMessage[clientKey] = {}
      this.subTopicsTopicsCount[clientKey] = {}
      this.subTopicsMessagesCount[clientKey] = {}
      this.topicsStructure[clientKey] = {}
    },
    clearTopicsAndSubTopicsMessages(clientKey: string, topicToRemove: string) {
      const topics = Object.keys(this.subTopicsTopicsCount[clientKey]).filter((topic) => {
        return topic.startsWith(`${topicToRemove}/`) || topic === topicToRemove
      })

      for (const topic of topics) {
        delete this.topicsMessages[clientKey][topic]
        delete this.topicsLastMessage[clientKey][topic]
        delete this.subTopicsTopicsCount[clientKey][topic]
        delete this.subTopicsMessagesCount[clientKey][topic]
      }

      this.clearTopicsAndSubTopicsStructure(clientKey, topicToRemove)
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
    },
    setTopicGroupOpened(clientKey: string, topic: string, opened: boolean) {
      if (!this.topicGroupOpened[clientKey]) this.topicGroupOpened[clientKey] = {}

      this.topicGroupOpened[clientKey][topic] = opened

      if (!opened) {
        Object.keys(this.topicGroupOpened[clientKey])
          .filter((subTopic) => subTopic.startsWith(topic + '/'))
          .forEach((subTopic) => (this.topicGroupOpened[clientKey][subTopic] = false))
      }
    }
  }
})
