import { defineStore } from 'pinia'

type SettingsStore = {
  showActivity: boolean
  dateFormat: string
  timeFormat: string
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsStore => ({
    showActivity: localStorage.getItem('showActivity') === 'true',
    dateFormat: localStorage.getItem('dateFormat') || 'YYYY/MM/DD',
    timeFormat: localStorage.getItem('timeFormat') || 'HH:mm:ss'
  }),
  getters: {
    dateTimeFormat() {
      return `${this.dateFormat} ${this.timeFormat}`
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
    }
  }
})
