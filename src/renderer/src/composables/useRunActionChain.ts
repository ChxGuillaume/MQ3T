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
import { computed, onBeforeUnmount, reactive } from 'vue'

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

type RunState = {
  running: boolean
  simulating: boolean
  log: ChainRunLogEntry[]
  outcome?: ChainRunOutcome
  iteration: { current: number; total: number }
  handle?: ChainRun
}

const createRunState = (): RunState => ({
  running: false,
  simulating: false,
  log: [],
  outcome: undefined,
  iteration: { current: 1, total: 1 },
  handle: undefined
})

const sharedRuns = reactive(new Map<string, RunState>())

const sharedRunState = (key: string): RunState => {
  if (!sharedRuns.has(key)) sharedRuns.set(key, createRunState())

  return sharedRuns.get(key)!
}

type UseRunActionChainOptions = {
  key?: () => string | undefined
  onNodeState?: (nodeId: string, state: ChainNodeState) => void
}

export function useRunActionChain(options: UseRunActionChainOptions = {}) {
  const localState = reactive(createRunState()) as RunState

  const historyStore = useChainRunHistoryStore()

  let clearTimer: ReturnType<typeof setTimeout> | undefined

  const state = computed<RunState>(() => {
    const key = options.key?.()

    return (key && sharedRuns.get(key)) || localState
  })

  const steps = computed(() =>
    state.value.log.filter((entry) => entry.id !== 'start' && entry.state !== 'skipped')
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
    const key = options.key?.()
    const target = key ? sharedRunState(key) : localState

    if (target.running) return

    clearTimeout(clearTimer)

    const hooks = {
      onNodeState: options.onNodeState,
      onLog: (entries: ChainRunLogEntry[]) => (target.log = entries),
      onIteration: (current: number, total: number) => (target.iteration = { current, total })
    }

    target.running = true
    target.simulating = !!runOptions.simulate
    target.outcome = undefined

    const startedAt = Date.now()
    const handle = runChain(graph, connectionId, hooks, runOptions)

    target.handle = handle

    const result = await handle.done

    if (runOptions.chainId && !runOptions.simulate) {
      historyStore.addRun(runOptions.chainId, {
        connectionId,
        startedAt,
        endedAt: Date.now(),
        outcome: result,
        iterations: handle.context.iteration,
        log: target.log
      })
    }

    target.running = false
    target.outcome = result
    target.handle = undefined

    if (result === 'stopped') clearNodeStates(graph, hooks)
    else clearTimer = setTimeout(() => clearNodeStates(graph, hooks), CLEAR_STATUS_DELAY)

    return result
  }

  const stop = () => state.value.handle?.stop()

  onBeforeUnmount(() => {
    clearTimeout(clearTimer)
    localState.handle?.stop()
  })

  return {
    running: computed(() => state.value.running),
    simulating: computed(() => state.value.simulating),
    log: computed(() => state.value.log),
    outcome: computed(() => state.value.outcome),
    iteration: computed(() => state.value.iteration),
    progress,
    run,
    stop
  }
}
