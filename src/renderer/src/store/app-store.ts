import { defineStore } from 'pinia'

export type AppTab = 'connections' | 'topics' | 'settings' | 'actions'

export const useAppStore = defineStore('app', {
  state: () => ({
    workingOnUpdate: false,
    currentTab: 'connections' as AppTab,
    appVersion: '',
    isScrubbingTopics: false
  }),
  actions: {
    setWorkingOnUpdate(working: boolean) {
      this.workingOnUpdate = working
    },
    setCurrentTab(tab: AppTab) {
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
