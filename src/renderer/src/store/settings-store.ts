import { defineStore } from 'pinia'
import moment from 'moment'

type SettingsStore = {
  showActivity: boolean
  dateFormat: string
  timeFormat: string
  maxMessages: number
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsStore => ({
    showActivity: localStorage.getItem('showActivity') === 'true',
    dateFormat: localStorage.getItem('dateFormat') || 'YYYY/MM/DD',
    timeFormat: localStorage.getItem('timeFormat') || 'HH:mm:ss',
    maxMessages: parseInt(localStorage.getItem('maxMessages') || '100')
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
    }
  }
})
