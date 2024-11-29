import { ChainAction, ConnectionsChainActions } from '../../../types/actions'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { v4 as uuidV4 } from 'uuid'
import { defineStore } from 'pinia'

export const useChainActionsStore = defineStore('chain-actions', {
  state: () => ({
    chainActions: {} as ConnectionsChainActions
  }),
  getters: {
    getConnectionChainActions: (state) => (connectionId: string) => {
      return state.chainActions[connectionId] || {}
    },
    getGroupChainActions: (state) => (connectionId: string, groupId: string) => {
      return state.chainActions[connectionId]?.[groupId] || []
    },
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
    setChainActions(chainActions: ConnectionsChainActions) {
      this.chainActions = chainActions
    },
    setConnectionGroupChainActions(
      connectionId: string,
      groupId: string,
      chainActions: ChainAction[]
    ) {
      if (!this.chainActions[connectionId]) this.chainActions[connectionId] = {}

      this.chainActions[connectionId][groupId] = chainActions

      this.saveChainActions()
    },
    addChainAction(connectionId: string, groupId: string, chainActions: Omit<ChainAction, 'id'>) {
      if (!this.chainActions[connectionId]) this.chainActions[connectionId] = {}
      if (!this.chainActions[connectionId][groupId]) this.chainActions[connectionId][groupId] = []

      this.chainActions[connectionId][groupId].push({
        id: `chain-action-${uuidV4()}`,
        ...chainActions
      })

      this.saveChainActions()
    },
    copyChainAction(connectionId: string, groupId: string, chainAction: ChainAction) {
      if (!this.chainActions[connectionId]) this.chainActions[connectionId] = {}
      if (!this.chainActions[connectionId][groupId]) this.chainActions[connectionId][groupId] = []

      this.chainActions[connectionId][groupId].push({
        ...JSON.parse(JSON.stringify(chainAction)),
        id: `chain-action-${uuidV4()}`,
        groupId
      })

      this.saveChainActions()
    },
    updateChainAction(connectionId: string, groupId: string, chainActions: ChainAction) {
      if (!this.chainActions[connectionId]) return
      if (!this.chainActions[connectionId][groupId]) return

      const index = this.chainActions[connectionId][groupId].findIndex(
        (a) => a.id === chainActions.id
      )

      if (index === -1) return

      this.chainActions[connectionId][groupId][index] = chainActions

      this.saveChainActions()
    },
    deleteChainAction(connectionId: string, groupId: string, chainActionId: string) {
      if (!this.chainActions[connectionId]) return
      if (!this.chainActions[connectionId][groupId]) return

      const index = this.chainActions[connectionId][groupId].findIndex(
        (a) => a.id === chainActionId
      )

      if (index === -1) return

      this.chainActions[connectionId][groupId].splice(index, 1)

      this.saveChainActions()
    },
    saveChainActions() {
      ElectronApi.saveChainActions(JSON.parse(JSON.stringify(this.chainActions)))
    }
  }
})
