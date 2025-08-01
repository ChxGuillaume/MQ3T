import { defineStore } from 'pinia'
import moment from 'moment'

type ActivityAnimationType = 'laser' | 'topic-heat'
type DefaultDataFormat = 'raw' | 'json' | 'xml'

type SettingsStore = {
  showActivity: boolean
  showActivityAnimationSpeed: number
  showActivityAnimationType: ActivityAnimationType
  dateFormat: string
  timeFormat: string
  maxMessages: number
  smartTopicGroupClose: boolean
  messagesPagination: boolean
  defaultDataFormat: DefaultDataFormat
  autoOpenPublishActions: boolean
  chainActionsTrackpadMode: boolean
  selectedMessageCompare: boolean
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsStore => ({
    showActivity: (localStorage.getItem('showActivity') || 'true') === 'true',
    showActivityAnimationSpeed: parseInt(
      localStorage.getItem('showActivityAnimationSpeed') || '1000'
    ),
    showActivityAnimationType:
      (localStorage.getItem('showActivityAnimationType') as ActivityAnimationType) || 'laser',
    dateFormat: localStorage.getItem('dateFormat') || 'YYYY/MM/DD',
    timeFormat: localStorage.getItem('timeFormat') || 'HH:mm:ss',
    maxMessages: parseInt(localStorage.getItem('maxMessages') || '100'),
    smartTopicGroupClose: (localStorage.getItem('smartTopicGroupClose') || 'true') === 'true',
    messagesPagination: (localStorage.getItem('messagesPagination') || 'true') === 'true',
    defaultDataFormat: (localStorage.getItem('defaultDataFormat') as DefaultDataFormat) || 'raw',
    autoOpenPublishActions: (localStorage.getItem('autoOpenPublishActions') || 'true') === 'true',
    chainActionsTrackpadMode:
      (localStorage.getItem('chainActionsTrackpadMode') || 'false') === 'true',
    selectedMessageCompare: (localStorage.getItem('lastMessageCompare') || 'true') === 'true'
  }),
  getters: {
    dateTimeFormat(): string {
      return `${this.dateFormat} ${this.timeFormat}`
    },
    formatDateTime(): (date: Date) => string {
      return (date: Date) => moment(date).format(this.dateTimeFormat)
    },
    formatDate(): (date: Date) => string {
      return (date: Date) => moment(date).format(this.dateFormat)
    },
    formatTime(): (date: Date) => string {
      return (date: Date) => moment(date).format(this.timeFormat)
    }
  },
  actions: {
    setShowActivity(value: boolean) {
      this.showActivity = value
      localStorage.setItem('showActivity', value.toString())
    },
    setShowActivityAnimationSpeed(value: number) {
      this.showActivityAnimationSpeed = value
      localStorage.setItem('showActivityAnimationSpeed', value.toString())
    },
    setShowActivityAnimationType(value: ActivityAnimationType) {
      this.showActivityAnimationType = value
      localStorage.setItem('showActivityAnimationType', value)
    },
    setDateFormat(value: string) {
      this.dateFormat = value
      localStorage.setItem('dateFormat', value)
    },
    setTimeFormat(value: string) {
      this.timeFormat = value
      localStorage.setItem('timeFormat', value)
    },
    setMaxMessages(value: number) {
      this.maxMessages = value
      localStorage.setItem('maxMessages', value.toString())
    },
    setSmartTopicGroupClose(value: boolean) {
      this.smartTopicGroupClose = value
      localStorage.setItem('smartTopicGroupClose', value.toString())
    },
    setMessagesPagination(value: boolean) {
      this.messagesPagination = value
      localStorage.setItem('messagesPagination', value.toString())
    },
    setDefaultDataFormat(value: DefaultDataFormat) {
      this.defaultDataFormat = value
      localStorage.setItem('defaultDataFormat', value)
    },
    setAutoOpenPublishActions(value: boolean) {
      this.autoOpenPublishActions = value
      localStorage.setItem('autoOpenPublishActions', value.toString())
    },
    setChainActionsTrackpadMode(value: boolean) {
      this.chainActionsTrackpadMode = value
      localStorage.setItem('chainActionsTrackpadMode', value.toString())
    },
    setSelectedMessageCompare(value: boolean) {
      this.selectedMessageCompare = value
      localStorage.setItem('lastMessageCompare', value.toString())
    }
  }
})
