import { ChainRunLogEntry, ChainRunOutcome } from '@renderer/composables/chain-runner'
import { defineStore } from 'pinia'
import { v4 as uuidV4 } from 'uuid'

const MAX_RUNS_PER_CHAIN = 10

export type ChainRunRecord = {
  id: string
  connectionId: string
  startedAt: number
  endedAt: number
  outcome: ChainRunOutcome
  iterations: number
  log: ChainRunLogEntry[]
}

export const useChainRunHistoryStore = defineStore('chain-run-history', {
  state: () => ({
    runs: {} as Record<string, ChainRunRecord[]>
  }),
  getters: {
    getChainRuns: (state) => (chainId: string) => state.runs[chainId] ?? []
  },
  actions: {
    addRun(chainId: string, run: Omit<ChainRunRecord, 'id'>) {
      this.runs[chainId] = [{ ...run, id: uuidV4() }, ...(this.runs[chainId] ?? [])].slice(
        0,
        MAX_RUNS_PER_CHAIN
      )
    },
    clearChainRuns(chainId: string) {
      delete this.runs[chainId]
    }
  }
})
