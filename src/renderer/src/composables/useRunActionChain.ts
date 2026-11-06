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

  return entry.time ? formatTime(entry.time) : ''
}

type UseRunActionChainOptions = {
  onNodeState?: (nodeId: string, state: ChainNodeState) => void
}

export function useRunActionChain(options: UseRunActionChainOptions = {}) {
  const running = ref(false)
  const log = ref<ChainRunLogEntry[]>([])
  const outcome = ref<ChainRunOutcome>()

  let currentRun: ChainRun | undefined
  let clearTimer: ReturnType<typeof setTimeout> | undefined

  const hooks = {
    onNodeState: options.onNodeState,
    onLog: (entries: ChainRunLogEntry[]) => (log.value = entries)
  }

  const steps = computed(() => log.value.filter((entry) => entry.id !== 'start'))

  const progress = computed(() => {
    const total = steps.value.length
    const done = steps.value.filter((entry) => entry.state === 'done').length

    return { total, done, current: Math.min(total, done + 1) }
  })

  const run = async (
    connectionId: string,
    graph: ChainRunGraph,
    runOptions: ChainRunOptions = {}
  ): Promise<ChainRunOutcome | undefined> => {
    if (running.value) return

    clearTimeout(clearTimer)

    running.value = true
    outcome.value = undefined
    currentRun = runChain(graph, connectionId, hooks, runOptions)

    const result = await currentRun.done

    running.value = false
    outcome.value = result
    currentRun = undefined

    if (result === 'stopped') clearNodeStates(graph, hooks)
    else clearTimer = setTimeout(() => clearNodeStates(graph, hooks), CLEAR_STATUS_DELAY)

    return result
  }

  const stop = () => currentRun?.stop()

  onBeforeUnmount(() => clearTimeout(clearTimer))

  return { running, run, stop, log, progress, outcome }
}
