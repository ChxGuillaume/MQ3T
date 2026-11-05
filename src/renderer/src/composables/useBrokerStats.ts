import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed, MaybeRefOrGetter, toValue } from 'vue'

export type BrokerType = 'Mosquitto' | 'EMQX' | 'Unknown'

export type BrokerStat = { label: string; value: string; note: string }

export type BrokerClients = { connected: number; disconnected?: number; peak?: number }

const compactNumber = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 2
})

const toNumber = (value?: string | null) => {
  if (value === undefined || value === null) return undefined

  const parsed = parseInt(value)

  return Number.isNaN(parsed) ? undefined : parsed
}

const formatCount = (value?: number) =>
  value === undefined ? 'Unknown' : compactNumber.format(value)

export const formatDuration = (seconds?: number) => {
  if (seconds === undefined) return 'Unknown'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days) return `${days} d ${hours} h`
  if (hours) return `${hours} h ${minutes} min`
  if (minutes) return `${minutes} min`

  return `${Math.floor(seconds)} s`
}

const sum = (values: (number | undefined)[]) =>
  values.some((v) => v !== undefined) ? values.reduce<number>((a, v) => a + (v ?? 0), 0) : undefined

export function useBrokerStats(clientKey: MaybeRefOrGetter<string>) {
  const mqttTopicsStore = useMqttTopicsStore()

  const read = (topic: string) =>
    mqttTopicsStore.getTopicLastMessage(toValue(clientKey), topic)?.message

  const emqxNodes = computed(() =>
    (read('$SYS/brokers') ?? '')
      .split(',')
      .map((node) => node.trim())
      .filter(Boolean)
  )

  const brokerType = computed<BrokerType>(() => {
    if (read('$SYS/brokers')?.includes('emqx')) return 'EMQX'
    if (read('$SYS/broker/version')?.includes('mosquitto')) return 'Mosquitto'

    return 'Unknown'
  })

  const emqxSum = (path: string) =>
    sum(emqxNodes.value.map((node) => toNumber(read(`$SYS/brokers/${node}/${path}`))))

  const name = computed(() => {
    switch (brokerType.value) {
      case 'Mosquitto': {
        const version = read('$SYS/broker/version') ?? ''
        return version.replace(/^mosquitto version/i, 'Mosquitto').trim()
      }
      case 'EMQX': {
        const version = read(`$SYS/brokers/${emqxNodes.value[0]}/version`)
        return version ? `EMQX ${version}` : 'EMQX'
      }
      default:
        return 'Unknown broker'
    }
  })

  const uptimeSeconds = computed(() => {
    if (brokerType.value === 'Mosquitto') return toNumber(read('$SYS/broker/uptime'))

    if (brokerType.value === 'EMQX') {
      const uptime = toNumber(read(`$SYS/brokers/${emqxNodes.value[0]}/uptime`))
      return uptime === undefined ? undefined : uptime / 1000
    }

    return undefined
  })

  const stats = computed<BrokerStat[]>(() => {
    if (brokerType.value === 'Mosquitto') {
      return [
        {
          label: 'Messages received',
          value: formatCount(toNumber(read('$SYS/broker/messages/received'))),
          note: '$SYS/broker/messages/received'
        },
        {
          label: 'Messages sent',
          value: formatCount(toNumber(read('$SYS/broker/messages/sent'))),
          note: '$SYS/broker/messages/sent'
        },
        {
          label: 'Subscriptions',
          value: formatCount(toNumber(read('$SYS/broker/subscriptions/count'))),
          note: '$SYS/broker/subscriptions/count'
        },
        {
          label: 'Clients total',
          value: formatCount(toNumber(read('$SYS/broker/clients/total'))),
          note: '$SYS/broker/clients/total'
        }
      ]
    }

    if (brokerType.value === 'EMQX') {
      const scope = emqxNodes.value.length > 1 ? `all ${emqxNodes.value.length} nodes` : null
      const note = (path: string) => scope ?? `$SYS/brokers/${emqxNodes.value[0]}/${path}`

      return [
        {
          label: 'Messages received',
          value: formatCount(emqxSum('metrics/messages/received')),
          note: note('metrics/messages/received')
        },
        {
          label: 'Messages sent',
          value: formatCount(emqxSum('metrics/messages/sent')),
          note: note('metrics/messages/sent')
        },
        {
          label: 'Subscriptions',
          value: formatCount(emqxSum('stats/subscribers/count')),
          note: note('stats/subscribers/count')
        }
      ]
    }

    return []
  })

  const clients = computed<BrokerClients | null>(() => {
    if (brokerType.value === 'Mosquitto') {
      const connected = toNumber(read('$SYS/broker/clients/connected'))
      if (connected === undefined) return null

      return {
        connected,
        disconnected: toNumber(read('$SYS/broker/clients/disconnected')),
        peak: toNumber(read('$SYS/broker/clients/maximum'))
      }
    }

    if (brokerType.value === 'EMQX') {
      const connected = emqxSum('metrics/client/connected')
      if (connected === undefined) return null

      return { connected, disconnected: emqxSum('metrics/client/disconnected') }
    }

    return null
  })

  return { brokerType, name, uptimeSeconds, stats, clients, emqxNodes }
}
