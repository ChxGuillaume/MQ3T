import {
  ChainNodeState,
  ChainRun,
  ChainRunGraph,
  ChainRunLogEntry,
  ChainRunOptions,
  ChainRunOutcome,
  clearNodeStates,
  runChain
} from './chain-runner'
import { useChainRunHistoryStore } from '@renderer/store/chain-run-history'
import { computed, onBeforeUnmount, ref } from 'vue'

export type { ChainRunLogEntry } from './chain-runner'

const CLEAR_STATUS_DELAY = 4000

const formatTime = (time: number) => {
  const date = new Date(time)
  const pad = (value: number, length = 2) => String(value).padStart(length, '0')

  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

export const formatRunLogTime = (entry: ChainRunLogEntry) => {
  if (entry.state === 'active') return 'now'
  if (entry.state === 'pending') return 'pending'
  if (entry.state === 'stopped') return 'stopped'
  if (entry.state === 'skipped') return 'skipped'

  return entry.time ? formatTime(entry.time) : ''
}

type UseRunActionChainOptions = {
  onNodeState?: (nodeId: string, state: ChainNodeState) => void
}

export function useRunActionChain(options: UseRunActionChainOptions = {}) {
  const running = ref(false)
  const log = ref<ChainRunLogEntry[]>([])
  const outcome = ref<ChainRunOutcome>()
  const iteration = ref({ current: 1, total: 1 })

  const historyStore = useChainRunHistoryStore()

  let currentRun: ChainRun | undefined
  let clearTimer: ReturnType<typeof setTimeout> | undefined

  const hooks = {
    onNodeState: options.onNodeState,
    onLog: (entries: ChainRunLogEntry[]) => (log.value = entries),
    onIteration: (current: number, total: number) => (iteration.value = { current, total })
  }

  const steps = computed(() =>
    log.value.filter((entry) => entry.id !== 'start' && entry.state !== 'skipped')
  )

  const progress = computed(() => {
    const total = steps.value.length
    const done = steps.value.filter((entry) => entry.state === 'done').length

    return { total, done, current: Math.min(total, done + 1) }
  })

  const run = async (
    connectionId: string,
    graph: ChainRunGraph,
    runOptions: ChainRunOptions & { chainId?: string } = {}
  ): Promise<ChainRunOutcome | undefined> => {
    if (running.value) return

    clearTimeout(clearTimer)

    running.value = true
    outcome.value = undefined
    const startedAt = Date.now()

    currentRun = runChain(graph, connectionId, hooks, runOptions)

    const result = await currentRun.done

    if (runOptions.chainId) {
      historyStore.addRun(runOptions.chainId, {
        connectionId,
        startedAt,
        endedAt: Date.now(),
        outcome: result,
        iterations: currentRun.context.iteration,
        log: log.value
      })
    }

    running.value = false
    outcome.value = result
    currentRun = undefined

    if (result === 'stopped') clearNodeStates(graph, hooks)
    else clearTimer = setTimeout(() => clearNodeStates(graph, hooks), CLEAR_STATUS_DELAY)

    return result
  }

  const stop = () => currentRun?.stop()

  onBeforeUnmount(() => clearTimeout(clearTimer))

  return { running, run, stop, log, progress, outcome, iteration }
}
