import { convertActionsFileV1toV2 } from '../assets/js/actions-convert'
import { ElectronApi } from '../assets/js/electron-api'
import { defineStore } from 'pinia'
import {
  ConnectionsActionsGroups,
  ConnectionsActionsFile,
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
      return state.actions[state.selectedConnection]?.[state.selectedActionGroup] || []
    },
    selectedConnectionGroups: (state): ActionGroup[] => {
      return state.actionsGroups[state.selectedConnection]
    }
  },
  actions: {
    setActions(actions: ConnectionsActionsFile) {
      if (actions.type === 'v1') {
        actions = convertActionsFileV1toV2(actions)
      }

      if (actions.type === 'v2') {
        this.actions = actions.actions
      }
    },
    setActionsGroups(actionsGroups: ConnectionsActionsGroups) {
      this.actionsGroups = actionsGroups
    },
    setConnectionActions(connectionId: string, groupId: string, actions: Action[]) {
      this.actions[connectionId][groupId] = actions
    },
    setConnectionActionsGroups(connectionId: string, actionsGroups: ActionGroup[]) {
      this.actionsGroups[connectionId] = actionsGroups
    },
    setSelectedConnectionGroupActions(actions: Action[]) {
      if (!this.actions[this.selectedConnection]) this.actions[this.selectedConnection] = {}

      this.actions[this.selectedConnection][this.selectedActionGroup] = actions

      this.saveActions()
    },
    setSelectedConnection(connectionId: string) {
      this.selectedConnection = connectionId
    },
    setSelectedActionGroup(groupId: string) {
      this.selectedActionGroup = groupId
    },
    addAction(action: Action) {
      if (!this.actions[this.selectedConnection]) this.actions[this.selectedConnection] = {}
      if (!this.actions[this.selectedConnection])
        this.actions[this.selectedConnection][this.selectedActionGroup] = []

      this.actions[this.selectedConnection][this.selectedActionGroup].push(action)

      this.saveActions()
    },
    addActionGroup(group: ActionGroup) {
      if (!this.actionsGroups[this.selectedConnection])
        this.actionsGroups[this.selectedConnection] = []

      this.actionsGroups[this.selectedConnection].push(group)

      this.saveActionsGroups()
    },
    updateAction(action: Action) {
      const index = this.actions[this.selectedConnection][this.selectedActionGroup].findIndex(
        (a) => a.id === action.id
      )

      this.actions[this.selectedConnection][this.selectedActionGroup].splice(index, 1, action)

      this.saveActions()
    },
    updateActionGroup(group: ActionGroup) {
      const index = this.actionsGroups[this.selectedConnection].findIndex((g) => g.id === group.id)

      this.actionsGroups[this.selectedConnection].splice(index, 1, group)

      this.saveActionsGroups()
    },
    deleteAction(actionId: string) {
      const index = this.actions[this.selectedConnection][this.selectedActionGroup].findIndex(
        (a) => a.id === actionId
      )

      this.actions[this.selectedConnection][this.selectedActionGroup].splice(index, 1)

      this.saveActions()
    },
    deleteActionGroup(groupId: string) {
      const index = this.actionsGroups[this.selectedConnection].findIndex((g) => g.id === groupId)

      this.actionsGroups[this.selectedConnection].splice(index, 1)

      for (const action of this.actions[this.selectedConnection][groupId]) {
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
      ElectronApi.saveActions({
        type: 'v2',
        actions: JSON.parse(JSON.stringify(this.actions))
      })
    },
    saveActionsGroups() {
      ElectronApi.saveActionsGroups(JSON.parse(JSON.stringify(this.actionsGroups)))
    }
  }
})
