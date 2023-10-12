import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    currentTab: 'connections',
    appVersion: ''
  }),
  actions: {
    setCurrentTab(tab: string) {
      this.currentTab = tab
    },
    setAppVersion(version: string) {
      this.appVersion = version
    }
  }
})
