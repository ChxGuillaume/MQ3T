import { defineStore } from 'pinia'

export type Action = {
  id: string
  groupId: string | 'default'
  name: string
  description: string
  topic: string
  payload: string
}

export type ActionGroup = {
  id: string
  name: string
  description: string
}

export const useActionsStore = defineStore('actions', {
  state: () => ({
    actions: {} as Record<string, Action[]>,
    actionsGroups: {} as Record<string, ActionGroup[]>,
    selectedConnection: '',
    selectedActionGroup: 'default'
  }),
  getters: {
    selectedConnectionGroupActions: (state) => {
      return state.actions[state.selectedConnection]?.filter(
        (action) => action.groupId === state.selectedActionGroup
      )
    },
    selectedConnectionGroups: (state) => {
      return state.actionsGroups[state.selectedConnection]
    }
  },
  actions: {
    setActions(connectionId: string, actions: Action[]) {
      this.actions[connectionId] = actions
    },
    setActionsGroups(connectionId: string, actionsGroups: ActionGroup[]) {
      this.actionsGroups[connectionId] = actionsGroups
    },
    setSelectedConnection(connectionId: string) {
      this.selectedConnection = connectionId
    },
    setSelectedActionGroup(groupId: string) {
      this.selectedActionGroup = groupId
    },
    addAction(action: Action) {
      if (!this.actions[this.selectedConnection]) this.actions[this.selectedConnection] = []

      this.actions[this.selectedConnection].push(action)

      this.save()
    },
    addActionGroup(group: ActionGroup) {
      if (!this.actionsGroups[this.selectedConnection])
        this.actionsGroups[this.selectedConnection] = []

      this.actionsGroups[this.selectedConnection].push(group)

      this.save()
    },
    updateAction(action: Action) {
      const index = this.actions[this.selectedConnection].findIndex((a) => a.id === action.id)

      this.actions[this.selectedConnection].splice(index, 1, action)

      this.save()
    },
    updateActionGroup(group: ActionGroup) {
      const index = this.actionsGroups[this.selectedConnection].findIndex((g) => g.id === group.id)

      this.actionsGroups[this.selectedConnection].splice(index, 1, group)

      this.save()
    },
    deleteAction(actionId: string) {
      const index = this.actions[this.selectedConnection].findIndex((a) => a.id === actionId)

      this.actions[this.selectedConnection].splice(index, 1)

      this.save()
    },
    deleteActionGroup(groupId: string) {
      const index = this.actionsGroups[this.selectedConnection].findIndex((g) => g.id === groupId)

      this.actionsGroups[this.selectedConnection].splice(index, 1)

      for (const action of this.actions[this.selectedConnection]) {
        if (action.groupId === groupId) action.groupId = 'default'
      }

      this.save()
    },
    save() {
      localStorage.setItem('actions', JSON.stringify(this.actions))
      localStorage.setItem('actionsGroups', JSON.stringify(this.actionsGroups))
    }
  }
})
