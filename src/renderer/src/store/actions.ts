import { convertActionsFileV1toV2 } from '../assets/js/actions-convert'
import { ElectronApi } from '../assets/js/electron-api'
import { defineStore } from 'pinia'
import { v4 as uuidV4 } from 'uuid'
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
    selectedConnectionGroupActionsRecord: (state): Record<string, Action[]> => {
      return state.actions[state.selectedConnection] || {}
    },
    selectedConnectionGroupActions: (state): Action[] => {
      return state.actions[state.selectedConnection]?.[state.selectedActionGroup] || []
    },
    selectedConnectionGroups: (state): ActionGroup[] => {
      return state.actionsGroups[state.selectedConnection] || []
    },
    getSelectedConnectionGroupActions:
      (state) =>
      (groupId: string): Action[] => {
        return state.actions[state.selectedConnection]?.[groupId] || []
      },
    getConnectionGroups:
      (state) =>
      (connectionId: string): ActionGroup[] => {
        return state.actionsGroups[connectionId] || []
      },
    getConnectionGroup:
      (state) =>
      (connectionId: string, groupId: string): ActionGroup | undefined => {
        return state.actionsGroups[connectionId]?.find((g) => g.id === groupId)
      },
    getConnectionGroupActionsRecord:
      (state) =>
      (connectionId: string, groupId: string): Record<string, Action[]> => {
        const record = state.actions[connectionId]

        return { [groupId]: record[groupId] } || {}
      },
    getAction:
      (state) =>
      (actionId: string): Action | undefined => {
        for (const group of Object.values(state.actions[state.selectedConnection])) {
          const action = group.find((a) => a.id === actionId)

          if (action) return action
        }

        return undefined
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
    setSelectedConnectionGroups(actionsGroups: ActionGroup[]) {
      this.actionsGroups[this.selectedConnection] = actionsGroups

      this.saveActionsGroups()
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
    addActionToConnectionGroup(action: Action, connectionId: string, groupId: string) {
      if (!this.actions[connectionId]) this.actions[connectionId] = {}
      if (!this.actions[connectionId][groupId]) this.actions[connectionId][groupId] = []

      const copy = JSON.parse(JSON.stringify(action))

      copy.id = `action-${uuidV4()}`
      copy.groupId = groupId

      this.actions[connectionId][groupId].push(copy)

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
    deleteActionFromConnectionGroup(actionId: string, connectionId: string, groupId: string) {
      const index = this.actions[connectionId][groupId].findIndex((a) => a.id === actionId)

      this.actions[connectionId][groupId].splice(index, 1)

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
