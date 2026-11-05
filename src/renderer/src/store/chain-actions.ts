import { ChainAction, ConnectionsChainActions } from '../../../types/actions'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { useActionsStore } from './actions'
import { v4 as uuidV4 } from 'uuid'
import { defineStore } from 'pinia'

export const useChainActionsStore = defineStore('chain-actions', {
  state: () => ({
    chainActions: {} as ConnectionsChainActions
  }),
  getters: {
    getChainAction: (state) => (chainActionId: string) => {
      for (const connectionId in state.chainActions) {
        for (const groupId in state.chainActions[connectionId]) {
          const chainAction = state.chainActions[connectionId][groupId].find(
            (a) => a.id === chainActionId
          )

          if (chainAction) return chainAction
        }
      }

      return null
    }
  },
  actions: {
    storageKey(connectionId: string, groupId: string): string {
      return useActionsStore().resolveGroupStorageKey(connectionId, groupId)
    },
    getConnectionChainActions(connectionId: string): Record<string, ChainAction[]> {
      const sharedGroups = useActionsStore().getSharedGroupsForConnection(connectionId)

      return {
        ...(this.chainActions[connectionId] || {}),
        ...Object.fromEntries(
          sharedGroups.map((group) => [group.id, this.getGroupChainActions(connectionId, group.id)])
        )
      }
    },
    getGroupChainActions(connectionId: string, groupId: string): ChainAction[] {
      return this.chainActions[this.storageKey(connectionId, groupId)]?.[groupId] || []
    },
    ensureGroupChainActions(connectionId: string, groupId: string): ChainAction[] {
      const storageKey = this.storageKey(connectionId, groupId)

      if (!this.chainActions[storageKey]) this.chainActions[storageKey] = {}
      if (!this.chainActions[storageKey][groupId]) this.chainActions[storageKey][groupId] = []

      return this.chainActions[storageKey][groupId]
    },
    setChainActions(chainActions: ConnectionsChainActions) {
      this.chainActions = chainActions
    },
    setConnectionGroupChainActions(
      connectionId: string,
      groupId: string,
      chainActions: ChainAction[]
    ) {
      const storageKey = this.storageKey(connectionId, groupId)

      if (!this.chainActions[storageKey]) this.chainActions[storageKey] = {}

      this.chainActions[storageKey][groupId] = chainActions

      this.saveChainActions()
    },
    addChainAction(connectionId: string, groupId: string, chainActions: Omit<ChainAction, 'id'>) {
      this.ensureGroupChainActions(connectionId, groupId).push({
        ...chainActions,
        groupId: groupId,
        id: `chain-action-${uuidV4()}`
      })

      this.saveChainActions()
    },
    copyChainAction(connectionId: string, groupId: string, chainAction: ChainAction) {
      this.ensureGroupChainActions(connectionId, groupId).push({
        ...JSON.parse(JSON.stringify(chainAction)),
        id: `chain-action-${uuidV4()}`,
        groupId
      })

      this.saveChainActions()
    },
    updateChainAction(connectionId: string, groupId: string, chainActions: ChainAction) {
      const groupChainActions = this.getGroupChainActions(connectionId, groupId)
      const index = groupChainActions.findIndex((a) => a.id === chainActions.id)

      if (index === -1) return

      groupChainActions[index] = chainActions

      this.saveChainActions()
    },
    deleteChainAction(connectionId: string, groupId: string, chainActionId: string) {
      const groupChainActions = this.getGroupChainActions(connectionId, groupId)
      const index = groupChainActions.findIndex((a) => a.id === chainActionId)

      if (index === -1) return

      groupChainActions.splice(index, 1)

      this.saveChainActions()
    },
    deleteGroupChainActions(connectionId: string, groupId: string, moveToDefault = true) {
      const storageKey = this.storageKey(connectionId, groupId)
      const groupChainActions = this.chainActions[storageKey]?.[groupId]

      if (!groupChainActions) return

      if (moveToDefault) {
        this.ensureGroupChainActions(connectionId, 'default').push(
          ...groupChainActions.map((chainAction) => ({ ...chainAction, groupId: 'default' }))
        )
      }

      delete this.chainActions[storageKey][groupId]

      this.saveChainActions()
    },
    moveGroupChainActions(fromConnectionId: string, toConnectionId: string, groupId: string) {
      const groupChainActions = this.chainActions[fromConnectionId]?.[groupId]

      if (!groupChainActions) return

      if (!this.chainActions[toConnectionId]) this.chainActions[toConnectionId] = {}

      this.chainActions[toConnectionId][groupId] = groupChainActions
      delete this.chainActions[fromConnectionId][groupId]

      this.saveChainActions()
    },
    saveChainActions() {
      ElectronApi.saveChainActions(JSON.parse(JSON.stringify(this.chainActions)))
    }
  }
})
