import { ElectronApi } from '../assets/js/electron-api'
import { defineStore } from 'pinia'
import {
  ConnectionsActionsGroups,
  ConnectionsActions,
  ActionGroup,
  Action
} from '../../../types/actions'

export const useActionsStore = defineStore('actions', {
  state: () => ({
    actions: {} as ConnectionsActions,
    actionsGroups: {} as ConnectionsActionsGroups,
    selectedConnection: '',
    selectedActionGroup: 'default'
  }),
  getters: {
    selectedConnectionGroupActions: (state): Action[] => {
      return (
        state.actions[state.selectedConnection]?.filter(
          (action) => action.groupId === state.selectedActionGroup
        ) || []
      )
    },
    selectedConnectionGroups: (state): ActionGroup[] => {
      return state.actionsGroups[state.selectedConnection]
    }
  },
  actions: {
    setActions(actions: ConnectionsActions) {
      this.actions = actions
    },
    setActionsGroups(actionsGroups: ConnectionsActionsGroups) {
      this.actionsGroups = actionsGroups
    },
    setConnectionActions(connectionId: string, actions: Action[]) {
      this.actions[connectionId] = actions
    },
    setConnectionActionsGroups(connectionId: string, actionsGroups: ActionGroup[]) {
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

      this.saveActions()
    },
    addActionGroup(group: ActionGroup) {
      if (!this.actionsGroups[this.selectedConnection])
        this.actionsGroups[this.selectedConnection] = []

      this.actionsGroups[this.selectedConnection].push(group)

      this.saveActionsGroups()
    },
    updateAction(action: Action) {
      const index = this.actions[this.selectedConnection].findIndex((a) => a.id === action.id)

      this.actions[this.selectedConnection].splice(index, 1, action)

      this.saveActions()
    },
    updateActionGroup(group: ActionGroup) {
      const index = this.actionsGroups[this.selectedConnection].findIndex((g) => g.id === group.id)

      this.actionsGroups[this.selectedConnection].splice(index, 1, group)

      this.saveActionsGroups()
    },
    deleteAction(actionId: string) {
      const index = this.actions[this.selectedConnection].findIndex((a) => a.id === actionId)

      this.actions[this.selectedConnection].splice(index, 1)

      this.saveActions()
    },
    deleteActionGroup(groupId: string) {
      const index = this.actionsGroups[this.selectedConnection].findIndex((g) => g.id === groupId)

      this.actionsGroups[this.selectedConnection].splice(index, 1)

      for (const action of this.actions[this.selectedConnection]) {
        if (action.groupId === groupId) action.groupId = 'default'
      }

      if (this.selectedActionGroup === groupId) this.selectedActionGroup = 'default'

      this.saveActionsGroups()
    },
    sendAction(action: Action) {
      ElectronApi.sendMqttMessage(this.selectedConnection, action.topic, action.payload, {
        qos: action.qos,
        retain: action.retained
      })
    },
    saveActions() {
      ElectronApi.saveActions(JSON.parse(JSON.stringify(this.actions)))
    },
    saveActionsGroups() {
      ElectronApi.saveActionsGroups(JSON.parse(JSON.stringify(this.actionsGroups)))
    }
  }
})
