import { convertActionsFileV1toV2 } from '../assets/js/actions-convert'
import { ElectronApi } from '../assets/js/electron-api'
import { useActionsCacheStore } from './actions-cache'
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
    getConnectionActions:
      (state) =>
      (connectionId: string): Action[] => {
        const records = state.actions[connectionId]

        if (!records) return []

        return Object.values(records).flat()
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
    getConnectionGroupActions:
      (state) =>
      (connectionId: string, groupId: string): Action[] => {
        return state.actions[connectionId]?.[groupId] || []
      },
    getConnectionGroupActionsRecord:
      (state) =>
      (connectionId: string, groupId: string): Record<string, Action[]> => {
        const record = state.actions[connectionId]

        return { [groupId]: record[groupId] }
      },
    getAction:
      (state) =>
      (actionId: string): Action | undefined => {
        for (const group of Object.values(state.actions[state.selectedConnection])) {
          const action = group.find((a) => a.id === actionId)

          if (action) return action
        }

        return undefined
      },
    hasActionWithTopic:
      (state) =>
      (connectionId: string, topic: string): boolean => {
        return Object.values(state.actions[connectionId] || {}).some((group) =>
          group.some((action) => action.topic === topic)
        )
      }
  },
  actions: {
    setActions(actions: ConnectionsActionsFile) {
      const actionsCacheStore = useActionsCacheStore()

      if (actions.type === 'v1') {
        actions = convertActionsFileV1toV2(actions)
      }

      if (actions.type === 'v2') {
        this.actions = actions.actions

        for (const [connectionId, groups] of Object.entries(actions.actions)) {
          for (const [_, actionsArray] of Object.entries(groups)) {
            for (const action of actionsArray) {
              actionsCacheStore.addTopic(connectionId, action.topic)
            }
          }
        }
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
      this.addActionToConnectionGroup(action, this.selectedConnection, this.selectedActionGroup)
    },
    addActionToConnectionGroup(action: Action, connectionId: string, groupId: string) {
      const actionsCacheStore = useActionsCacheStore()

      if (!this.actions[connectionId]) this.actions[connectionId] = {}
      if (!this.actions[connectionId][groupId]) this.actions[connectionId][groupId] = []

      const copy = JSON.parse(JSON.stringify(action))

      copy.id = `action-${uuidV4()}`
      copy.groupId = groupId

      this.actions[connectionId][groupId].push(copy)

      this.saveActions()

      actionsCacheStore.addTopic(connectionId, action.topic)
    },
    addActionGroup(group: ActionGroup) {
      if (!this.actionsGroups[this.selectedConnection])
        this.actionsGroups[this.selectedConnection] = []

      this.actionsGroups[this.selectedConnection].push(group)

      this.saveActionsGroups()
    },
    addActionGroupToConnection(group: ActionGroup, connectionId: string): ActionGroup {
      if (!this.actionsGroups[connectionId]) this.actionsGroups[connectionId] = []

      const copy = JSON.parse(JSON.stringify(group))

      copy.id = `group-${uuidV4()}`

      this.actionsGroups[connectionId].push(copy)

      this.saveActionsGroups()

      return copy
    },
    updateAction(action: Action) {
      const actionsCacheStore = useActionsCacheStore()

      const actions = this.actions[this.selectedConnection][this.selectedActionGroup]
      const index = actions.findIndex((a) => a.id === action.id)

      const { 0: removedAction } = actions.splice(index, 1, action)

      this.saveActions()

      if (removedAction.topic !== action.topic) {
        if (!this.hasActionWithTopic(this.selectedConnection, removedAction.topic)) {
          actionsCacheStore.removeNormalTopic(this.selectedConnection, removedAction.topic)
        }

        actionsCacheStore.addTopic(this.selectedConnection, action.topic)
      }
    },
    updateActionGroup(group: ActionGroup) {
      const index = this.actionsGroups[this.selectedConnection].findIndex((g) => g.id === group.id)

      this.actionsGroups[this.selectedConnection].splice(index, 1, group)

      this.saveActionsGroups()
    },
    deleteAction(actionId: string) {
      this.deleteActionFromConnectionGroup(
        actionId,
        this.selectedConnection,
        this.selectedActionGroup
      )
    },
    deleteActionFromConnectionGroup(actionId: string, connectionId: string, groupId: string) {
      const actionsCacheStore = useActionsCacheStore()

      const actions = this.actions[connectionId][groupId]
      const index = actions.findIndex((a) => a.id === actionId)

      const { 0: removedAction } = actions.splice(index, 1)

      this.saveActions()

      if (!this.hasActionWithTopic(connectionId, removedAction.topic)) {
        actionsCacheStore.removeTopic(connectionId, removedAction.topic)
      }
    },
    deleteActionGroup(groupId: string, moveActionsToDefault = true) {
      const connectionId = this.selectedConnection
      const actions = this.actions[connectionId][groupId]

      if (actions) {
        // Duplicating the actions array to avoid mutation while deleting
        for (const action of JSON.parse(JSON.stringify(actions))) {
          if (moveActionsToDefault) this.addActionToConnectionGroup(action, connectionId, 'default')
          else this.deleteActionFromConnectionGroup(action.id, connectionId, groupId)
        }
      }

      delete this.actions[connectionId][groupId]

      this.deleteActionGroupFromConnection(groupId, connectionId)

      if (this.selectedActionGroup === groupId) this.selectedActionGroup = 'default'
    },
    deleteActionGroupFromConnection(groupId: string, connectionId: string) {
      const groupIndex = this.actionsGroups[connectionId].findIndex((g) => g.id === groupId)

      delete this.actions[connectionId][groupId]
      this.actionsGroups[connectionId].splice(groupIndex, 1)

      this.saveActions()
      this.saveActionsGroups()
    },
    sendAction(connectionId: string, action: Action, topicOverride?: string) {
      ElectronApi.sendMqttMessage(connectionId, topicOverride || action.topic, action.payload, {
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
