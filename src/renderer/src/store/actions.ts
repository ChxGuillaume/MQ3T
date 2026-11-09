import { convertActionsFileV1toV2 } from '../assets/js/actions-convert'
import { ElectronApi } from '../assets/js/electron-api'
import { useActionsCacheStore } from './actions-cache'
import { useChainActionsStore } from './chain-actions'
import { useMqttConnectionsStore } from './mqtt-connections'
import { defineStore } from 'pinia'
import { v4 as uuidV4 } from 'uuid'
import { IClientPublishOptions } from 'mqtt'
import {
  ConnectionsActionsGroups,
  ConnectionsActionsFile,
  ConnectionsActions,
  ActionGroup,
  Action
} from '../../../types/actions'

const withoutSharing = (group: ActionGroup): ActionGroup => {
  const { sharedWith: _, ...rest } = group

  return rest
}

export const useActionsStore = defineStore('actions', {
  state: () => ({
    actions: {} as ConnectionsActions,
    actionsGroups: {} as ConnectionsActionsGroups,

    // TODO: Redesign/Refactor causes this to be useless in practice, but implementation forces to keep it, refactor later
    selectedConnection: '',

    selectedActionGroup: 'default'
  }),
  getters: {
    getGroupOwner:
      (state) =>
      (groupId: string): string | undefined => {
        if (groupId === 'default') return undefined

        return Object.keys(state.actionsGroups).find((connectionId) =>
          state.actionsGroups[connectionId].some((g) => g.id === groupId)
        )
      },
    getSharedGroupsForConnection:
      (state) =>
      (connectionId: string): ActionGroup[] => {
        return Object.entries(state.actionsGroups)
          .filter(([ownerId]) => ownerId !== connectionId)
          .flatMap(([, groups]) => groups.filter((g) => g.sharedWith?.includes(connectionId)))
      }
  },
  actions: {
    findGroup(groupId: string): ActionGroup | undefined {
      const owner = this.getGroupOwner(groupId)

      return owner ? this.actionsGroups[owner].find((g) => g.id === groupId) : undefined
    },
    resolveActionsConnection(connectionId: string): string {
      const connection = useMqttConnectionsStore().getConnection(connectionId)

      return (connection?.temporary && connection.actionsFrom) || connectionId
    },
    resolveGroupStorageKey(connectionId: string, groupId: string): string {
      return this.getGroupOwner(groupId) ?? this.resolveActionsConnection(connectionId)
    },
    getGroupConnectionIds(groupId: string): string[] {
      const owner = this.getGroupOwner(groupId)

      if (!owner) return []

      return [owner, ...(this.findGroup(groupId)?.sharedWith ?? [])]
    },
    isSharedGroup(groupId: string): boolean {
      return !!this.findGroup(groupId)?.sharedWith?.length
    },
    getConnectionGroups(connectionId: string): ActionGroup[] {
      const sourceId = this.resolveActionsConnection(connectionId)

      return [
        ...(this.actionsGroups[sourceId] || []),
        ...this.getSharedGroupsForConnection(sourceId)
      ]
    },
    getConnectionGroup(connectionId: string, groupId: string): ActionGroup | undefined {
      return this.getConnectionGroups(connectionId).find((g) => g.id === groupId)
    },
    getConnectionGroupActions(connectionId: string, groupId: string): Action[] {
      return this.actions[this.resolveGroupStorageKey(connectionId, groupId)]?.[groupId] || []
    },
    getConnectionActions(connectionId: string): Action[] {
      const sourceId = this.resolveActionsConnection(connectionId)
      const ownActions = Object.values(this.actions[sourceId] || {}).flat()
      const sharedActions = this.getSharedGroupsForConnection(sourceId).flatMap((group) =>
        this.getConnectionGroupActions(sourceId, group.id)
      )

      return [...ownActions, ...sharedActions]
    },
    hasActionWithTopic(connectionId: string, topic: string): boolean {
      return this.getConnectionActions(connectionId).some((action) => action.topic === topic)
    },
    getTopicConnectionIds(connectionId: string, groupId: string): string[] {
      const groupConnectionIds = this.getGroupConnectionIds(groupId)
      const connectionIds = groupConnectionIds.length
        ? groupConnectionIds
        : [this.resolveActionsConnection(connectionId)]
      const borrowingConnectionIds = useMqttConnectionsStore()
        .temporaryConnections.filter((c) => c.actionsFrom && connectionIds.includes(c.actionsFrom))
        .map((c) => c.clientKey)

      return [...connectionIds, ...borrowingConnectionIds]
    },
    cacheConnectionTopics(connectionId: string) {
      for (const action of this.getConnectionActions(connectionId)) {
        this.addTopicToConnections([connectionId], action.topic)
      }
    },
    addTopicToConnections(connectionIds: string[], topic: string) {
      const actionsCacheStore = useActionsCacheStore()

      for (const connectionId of connectionIds) actionsCacheStore.addTopic(connectionId, topic)
    },
    pruneTopicsFromConnections(connectionIds: string[], topics: string[]) {
      const actionsCacheStore = useActionsCacheStore()

      for (const connectionId of connectionIds) {
        for (const topic of new Set(topics)) {
          if (!this.hasActionWithTopic(connectionId, topic)) {
            actionsCacheStore.removeTopic(connectionId, topic)
          }
        }
      }
    },
    cacheSharedGroupsTopics() {
      for (const groups of Object.values(this.actionsGroups)) {
        for (const group of groups) {
          if (!group.sharedWith?.length) continue

          for (const action of this.getConnectionGroupActions('', group.id)) {
            this.addTopicToConnections(group.sharedWith, action.topic)
          }
        }
      }
    },
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

        this.cacheSharedGroupsTopics()
      }
    },
    setActionsGroups(actionsGroups: ConnectionsActionsGroups) {
      this.actionsGroups = actionsGroups

      this.cacheSharedGroupsTopics()
    },
    setSelectedConnectionGroups(actionsGroups: ActionGroup[]) {
      const ownGroupIds = new Set(
        (this.actionsGroups[this.selectedConnection] || []).map((g) => g.id)
      )

      this.actionsGroups[this.selectedConnection] = actionsGroups.filter((g) =>
        ownGroupIds.has(g.id)
      )

      this.saveActionsGroups()
    },
    setSelectedConnectionGroupActions(actions: Action[]) {
      const storageKey = this.resolveGroupStorageKey(
        this.selectedConnection,
        this.selectedActionGroup
      )

      if (!this.actions[storageKey]) this.actions[storageKey] = {}

      this.actions[storageKey][this.selectedActionGroup] = actions

      this.saveActions()
    },
    setSelectedConnection(connectionId: string) {
      this.selectedConnection = connectionId
    },
    setSelectedActionGroup(groupId: string) {
      this.selectedActionGroup = groupId
    },
    addActionToConnectionGroup(action: Action, connectionId: string, groupId: string) {
      const storageKey = this.resolveGroupStorageKey(connectionId, groupId)

      if (!this.actions[storageKey]) this.actions[storageKey] = {}
      if (!this.actions[storageKey][groupId]) this.actions[storageKey][groupId] = []

      const copy = JSON.parse(JSON.stringify(action))

      copy.id = `action-${uuidV4()}`
      copy.groupId = groupId

      this.actions[storageKey][groupId].push(copy)

      this.saveActions()

      this.addTopicToConnections(this.getTopicConnectionIds(connectionId, groupId), action.topic)
    },
    addActionGroup(group: ActionGroup) {
      if (!this.actionsGroups[this.selectedConnection])
        this.actionsGroups[this.selectedConnection] = []

      this.actionsGroups[this.selectedConnection].push(group)

      this.saveActionsGroups()
    },
    addActionGroupToConnection(group: ActionGroup, connectionId: string): ActionGroup {
      if (!this.actionsGroups[connectionId]) this.actionsGroups[connectionId] = []

      const copy = withoutSharing(JSON.parse(JSON.stringify(group)))

      copy.id = `group-${uuidV4()}`

      this.actionsGroups[connectionId].push(copy)

      this.saveActionsGroups()

      return copy
    },
    updateAction(clientKey: string, actionGroupId: string, action: Action) {
      const actionsCacheStore = useActionsCacheStore()

      const actions =
        this.actions[this.resolveGroupStorageKey(clientKey, actionGroupId)][actionGroupId]
      const index = actions.findIndex((a) => a.id === action.id)

      const { 0: removedAction } = actions.splice(index, 1, action)

      this.saveActions()

      if (removedAction.topic !== action.topic) {
        for (const connectionId of this.getTopicConnectionIds(clientKey, actionGroupId)) {
          if (!this.hasActionWithTopic(connectionId, removedAction.topic)) {
            actionsCacheStore.removeNormalTopic(connectionId, removedAction.topic)
          }

          actionsCacheStore.addTopic(connectionId, action.topic)
        }
      }
    },
    updateActionGroup(group: ActionGroup) {
      const owner = this.resolveGroupStorageKey(this.selectedConnection, group.id)
      const groups = this.actionsGroups[owner]
      const index = groups.findIndex((g) => g.id === group.id)

      groups.splice(index, 1, { ...group, sharedWith: groups[index].sharedWith })

      this.saveActionsGroups()
    },
    deleteActionFromConnectionGroup(actionId: string, connectionId: string, groupId: string) {
      const actions = this.actions[this.resolveGroupStorageKey(connectionId, groupId)][groupId]
      const index = actions.findIndex((a) => a.id === actionId)

      const { 0: removedAction } = actions.splice(index, 1)

      this.saveActions()

      this.pruneTopicsFromConnections(this.getTopicConnectionIds(connectionId, groupId), [
        removedAction.topic
      ])
    },
    deleteActionGroup(groupId: string, moveActionsToDefault = true) {
      const connectionId = this.selectedConnection

      if (moveActionsToDefault) {
        for (const action of this.getConnectionGroupActions(connectionId, groupId)) {
          this.addActionToConnectionGroup(action, connectionId, 'default')
        }
      }

      this.deleteActionGroupFromConnection(connectionId, groupId)

      if (this.selectedActionGroup === groupId) this.selectedActionGroup = 'default'
    },
    deleteActionGroupFromConnection(connectionId: string, groupId: string) {
      const owner = this.resolveGroupStorageKey(connectionId, groupId)
      const connectionIds = this.getTopicConnectionIds(connectionId, groupId)
      const topics = this.getConnectionGroupActions(connectionId, groupId).map((a) => a.topic)
      const groupIndex = this.actionsGroups[owner].findIndex((g) => g.id === groupId)

      if (this.actions[owner]) delete this.actions[owner][groupId]
      this.actionsGroups[owner].splice(groupIndex, 1)

      this.saveActions()
      this.saveActionsGroups()

      this.pruneTopicsFromConnections(connectionIds, topics)
    },
    setGroupSharedWith(groupId: string, connectionIds: string[]) {
      const owner = this.getGroupOwner(groupId)
      const group = this.findGroup(groupId)

      if (!owner || !group) return

      const previous = group.sharedWith ?? []
      const next = [...new Set(connectionIds)].filter((id) => id !== owner)
      const topics = this.getConnectionGroupActions(owner, groupId).map((a) => a.topic)

      if (next.length) group.sharedWith = next
      else delete group.sharedWith

      this.saveActionsGroups()

      for (const topic of topics) {
        this.addTopicToConnections(
          next.filter((id) => !previous.includes(id)),
          topic
        )
      }

      this.pruneTopicsFromConnections(
        previous.filter((id) => !next.includes(id)),
        topics
      )
    },
    transferGroupOwnership(groupId: string, newOwner: string) {
      const chainActionsStore = useChainActionsStore()

      const owner = this.getGroupOwner(groupId)

      if (!owner || owner === newOwner) return

      const groupIndex = this.actionsGroups[owner].findIndex((g) => g.id === groupId)
      const { 0: group } = this.actionsGroups[owner].splice(groupIndex, 1)

      group.sharedWith = [owner, ...(group.sharedWith ?? []).filter((id) => id !== newOwner)]

      if (!this.actionsGroups[newOwner]) this.actionsGroups[newOwner] = []
      this.actionsGroups[newOwner].push(group)

      const groupActions = this.actions[owner]?.[groupId]

      if (groupActions) {
        if (!this.actions[newOwner]) this.actions[newOwner] = {}
        this.actions[newOwner][groupId] = groupActions
        delete this.actions[owner][groupId]
      }

      chainActionsStore.moveGroupChainActions(owner, newOwner, groupId)

      this.saveActions()
      this.saveActionsGroups()
    },
    setGroupConnections(groupId: string, connectionIds: string[]) {
      const owner = this.getGroupOwner(groupId)

      if (!owner || !connectionIds.length) return

      if (!connectionIds.includes(owner)) this.transferGroupOwnership(groupId, connectionIds[0])

      this.setGroupSharedWith(groupId, connectionIds)
    },
    unshareGroupFromConnection(groupId: string, connectionId: string) {
      if (!this.isSharedGroup(groupId)) return

      this.setGroupConnections(
        groupId,
        this.getGroupConnectionIds(groupId).filter((id) => id !== connectionId)
      )
    },
    removeConnectionFromSharing(connectionId: string) {
      const sharedGroupIds = [
        ...(this.actionsGroups[connectionId] || []).filter((g) => g.sharedWith?.length),
        ...this.getSharedGroupsForConnection(connectionId)
      ].map((g) => g.id)

      for (const groupId of sharedGroupIds) this.unshareGroupFromConnection(groupId, connectionId)
    },
    sendAction(connectionId: string, action: Action, topicOverride?: string) {
      const publishOptions: IClientPublishOptions = {
        qos: action.qos,
        retain: action.retained
      }

      const isMqtt5 = useMqttConnectionsStore().getConnection(connectionId)?.protocolVersion === 5

      if (isMqtt5 && (action.responseTopic || action.correlationData)) {
        publishOptions.properties = {}

        if (action.responseTopic) publishOptions.properties.responseTopic = action.responseTopic
        if (action.correlationData) {
          publishOptions.properties.correlationData = action.correlationData as unknown as Buffer
        }
      }

      ElectronApi.sendMqttMessage(
        connectionId,
        topicOverride || action.topic,
        action.payload,
        publishOptions
      )
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
