import { defineStore } from 'pinia'

export type AppView = 'connection' | 'new-tab' | 'settings'

export type ConnectionSection = 'explore' | 'actions' | 'graphs' | 'broker'

export const useAppStore = defineStore('app', {
  state: () => ({
    workingOnUpdate: false,
    view: 'new-tab' as AppView,
    sectionByConnection: {} as Record<string, ConnectionSection>,
    appVersion: '',
    isScrubbingTopics: false
  }),
  getters: {
    getSection:
      (state) =>
      (clientKey: string): ConnectionSection =>
        state.sectionByConnection[clientKey] ?? 'explore'
  },
  actions: {
    setWorkingOnUpdate(working: boolean) {
      this.workingOnUpdate = working
    },
    setView(view: AppView) {
      this.view = view
    },
    setSection(clientKey: string, section: ConnectionSection) {
      this.sectionByConnection[clientKey] = section
    },
    setAppVersion(version: string) {
      this.appVersion = version
    },
    setIsScrubbingTopics(scrubbing: boolean) {
      this.isScrubbingTopics = scrubbing
    }
  }
})
