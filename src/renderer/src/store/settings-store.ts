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
}

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  const value = localStorage.getItem(key)

  if (value === null) return defaultValue
  if (typeof defaultValue === 'boolean') return (value === 'true') as T
  if (typeof defaultValue === 'number') return parseInt(value) as T

  return value as T
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsStore => ({
    showActivity: getFromStorage('showActivity', true),
    showActivityAnimationSpeed: getFromStorage('showActivityAnimationSpeed', 1000),
    showActivityAnimationType: getFromStorage<ActivityAnimationType>(
      'showActivityAnimationType',
      'laser'
    ),
    dateFormat: getFromStorage('dateFormat', 'YYYY/MM/DD'),
    timeFormat: getFromStorage('timeFormat', 'HH:mm:ss'),
    maxMessages: getFromStorage('maxMessages', 100),
    smartTopicGroupClose: getFromStorage('smartTopicGroupClose', true),
    messagesPagination: getFromStorage('messagesPagination', true),
    defaultDataFormat: getFromStorage<DefaultDataFormat>('defaultDataFormat', 'raw'),
    autoOpenPublishActions: getFromStorage('autoOpenPublishActions', true),
    chainActionsTrackpadMode: getFromStorage('chainActionsTrackpadMode', false)
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
    }
  }
})
