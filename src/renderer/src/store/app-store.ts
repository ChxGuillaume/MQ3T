import { defineStore } from 'pinia'

export type AppView = 'connection' | 'new-tab' | 'settings' | 'connection-editor'

export type ConnectionSection = 'explore' | 'actions' | 'graphs' | 'broker'

export const useAppStore = defineStore('app', {
  state: () => ({
    workingOnUpdate: false,
    view: 'new-tab' as AppView,
    sectionByConnection: {} as Record<string, ConnectionSection>,
    editingClientKey: null as string | null,
    editorAnchor: null as string | null,
    editorReturnView: 'new-tab' as AppView,
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
    openConnectionEditor(clientKey: string | null, anchor: string | null = null) {
      if (this.view !== 'connection-editor') this.editorReturnView = this.view
      this.editingClientKey = clientKey
      this.editorAnchor = anchor
      this.view = 'connection-editor'
    },
    closeConnectionEditor() {
      this.editingClientKey = null
      this.editorAnchor = null
      this.view = this.editorReturnView
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
