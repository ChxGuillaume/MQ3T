import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    workingOnUpdate: false,
    currentTab: 'connections',
    appVersion: '',
    isScrubbingTopics: false
  }),
  actions: {
    setWorkingOnUpdate(working: boolean) {
      this.workingOnUpdate = working
    },
    setCurrentTab(tab: string) {
      this.currentTab = tab
    },
    setAppVersion(version: string) {
      this.appVersion = version
    },
    setIsScrubbingTopics(scrubbing: boolean) {
      this.isScrubbingTopics = scrubbing
    }
  }
})
