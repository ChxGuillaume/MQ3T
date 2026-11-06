import {
  Action,
  ChainAction,
  ChainActionNode,
  ConditionNodeData,
  WaitMessageNodeData
} from '../../../../types/actions'
import { Edge } from '@vue-flow/core'
import { v4 as uuidV4 } from 'uuid'

export type ExampleChain = Pick<ChainAction, 'name' | 'nodes' | 'edges' | 'repeat'>

export type ExampleTourItem = { icon: string; title: string; text: string }

export type ChainExample = {
  id: string
  label: string
  description: string
  icon: string
  build: () => ExampleChain
  tour: ExampleTourItem[]
}

const json = (value: unknown) => JSON.stringify(value, null, 2)

const createBuilder = () => {
  const nodes: ChainActionNode[] = [
    { id: 'start', type: 'start', position: { x: 30, y: 40 }, deletable: false }
  ]
  const edges: Edge[] = []
  const position = { x: 0, y: 0 }

  const action = (
    name: string,
    topic: string,
    payload: unknown,
    extra: Partial<Action> = {}
  ): string => {
    const id = uuidV4()

    nodes.push({
      id,
      type: 'action',
      position,
      data: {
        action: {
          id: `example-${uuidV4()}`,
          groupId: 'default',
          name,
          topic,
          qos: 0,
          retained: false,
          payload: json(payload),
          payloadFormat: 'json',
          ...extra
        }
      }
    })

    return id
  }

  const waitFor = (data: WaitMessageNodeData): string => {
    const id = uuidV4()

    nodes.push({ id, type: 'wait-message', position, data })

    return id
  }

  const condition = (data: ConditionNodeData): string => {
    const id = uuidV4()

    nodes.push({ id, type: 'condition', position, data })

    return id
  }

  const pause = (duration: number, durationType: 'ms' | 's'): string => {
    const id = uuidV4()

    nodes.push({ id, type: 'wait', position, data: { duration, durationType } })

    return id
  }

  const link = (source: string, target: string, sourceHandle?: 'true' | 'false') => {
    edges.push({ id: uuidV4(), source, target, sourceHandle, animated: true })
  }

  return { nodes, edges, action, waitFor, condition, pause, link }
}

const buildSimpleExample = (): ExampleChain => {
  const chain = createBuilder()

  const ask = chain.action('Ask the device for its status', 'mq3t/example/$s$device$/get', {
    requestId: '$uuid$v4$'
  })
  const listen = chain.waitFor({
    topic: 'mq3t/example/+/status',
    timeout: 5,
    timeoutUnit: 's',
    match: { kind: 'path', path: '$.online', value: 'true' },
    captures: [
      { name: 'status', path: '$.status' },
      { name: 'battery', path: '$.battery' }
    ],
    simulatedReply: json({ online: true, status: 'ready', battery: 82 })
  })
  const check = chain.condition({
    source: 'variable',
    name: 'status',
    operator: 'equals',
    value: 'ready'
  })
  const start = chain.action('Start the job', 'mq3t/example/$s$device$/start', {
    battery: '$n$battery$'
  })
  const wait = chain.pause(1, 's')
  const report = chain.action('Log that the job started', 'mq3t/example/log', {
    device: '$s$device$',
    result: 'started'
  })
  const alert = chain.action('Raise an alert', 'mq3t/example/alerts', {
    device: '$s$device$',
    status: '$s$status$'
  })

  chain.link('start', ask)
  chain.link(ask, listen)
  chain.link(listen, check)
  chain.link(check, start, 'true')
  chain.link(start, wait)
  chain.link(wait, report)
  chain.link(check, alert, 'false')

  return {
    name: 'Example: check a device, then start a job',
    nodes: chain.nodes,
    edges: chain.edges,
    repeat: { count: 2, interval: 2, intervalUnit: 's' }
  }
}

const buildCompleteExample = (): ExampleChain => {
  const chain = createBuilder()

  const ask = chain.action('Ask the device for its status', 'mq3t/example/$s$device$/get', {
    requestId: '$uuid$v4$'
  })
  const status = chain.waitFor({
    topic: 'mq3t/example/+/status',
    timeout: 5,
    timeoutUnit: 's',
    match: { kind: 'path', path: '$.online', value: 'true' },
    captures: [
      { name: 'battery', path: '$.battery' },
      { name: 'firmware', path: '$.firmware.version' }
    ],
    simulatedReply: json({ online: true, battery: 76, firmware: { version: '2.3.1' } })
  })

  const batteryCheck = chain.condition({
    source: 'variable',
    name: 'battery',
    operator: 'gt',
    value: '20'
  })
  const update = chain.action(
    'Send the firmware update',
    'mq3t/example/$s$device$/update',
    {
      version: '$s$version$',
      channel: '$enum$channel$',
      force: '$b$force$',
      requestId: '$uuid$v4$'
    },
    { enumOptions: { channel: ['stable', 'beta', 'nightly'] } }
  )
  const progress = chain.waitFor({
    topic: 'mq3t/example/+/update/progress',
    timeout: 30,
    timeoutUnit: 's',
    match: { kind: 'contains', value: 'state' },
    captures: [{ name: 'installed', path: '$.installed' }],
    simulatedReply: json({ state: 'done', installed: '2.4.0' })
  })
  const installCheck = chain.condition({
    source: 'message',
    path: '$.state',
    operator: 'equals',
    value: 'done'
  })
  const reboot = chain.action('Reboot the device', 'mq3t/example/$s$device$/reboot', {
    delay: 0
  })
  const settle = chain.pause(2, 's')
  const success = chain.action('Log the successful update', 'mq3t/example/log', {
    device: '$s$device$',
    from: '$s$firmware$',
    to: '$s$installed$'
  })
  const failed = chain.action('Report a failed install', 'mq3t/example/alerts', {
    device: '$s$device$',
    reason: 'install did not finish'
  })
  const lowBattery = chain.action('Warn about a low battery', 'mq3t/example/alerts', {
    device: '$s$device$',
    battery: '$n$battery$'
  })

  const firmwareKnown = chain.condition({
    source: 'variable',
    name: 'firmware',
    operator: 'exists'
  })
  const dashboard = chain.action('Update the dashboard', 'mq3t/example/dashboard', {
    device: '$s$device$',
    firmware: '$s$firmware$',
    battery: '$n$battery$'
  })

  chain.link('start', ask)
  chain.link(ask, status)
  chain.link(status, batteryCheck)
  chain.link(batteryCheck, update, 'true')
  chain.link(update, progress)
  chain.link(progress, installCheck)
  chain.link(installCheck, reboot, 'true')
  chain.link(reboot, settle)
  chain.link(settle, success)
  chain.link(installCheck, failed, 'false')
  chain.link(batteryCheck, lowBattery, 'false')
  chain.link(status, firmwareKnown)
  chain.link(firmwareKnown, dashboard, 'true')

  return {
    name: 'Example: update a device’s firmware',
    nodes: chain.nodes,
    edges: chain.edges,
    repeat: { count: 2, interval: 3, intervalUnit: 's' }
  }
}

export const CHAIN_EXAMPLES: ChainExample[] = [
  {
    id: 'simple',
    label: 'Simple example',
    description: 'Ask a device for its status, then start a job or raise an alert.',
    icon: 'i-lucide-sparkles',
    build: buildSimpleExample,
    tour: [
      {
        icon: 'i-lucide-text-cursor-input',
        title: 'Values asked at run time',
        text: 'The first step sends to mq3t/example/$s$device$/get, so the chain asks for a device name when it starts.'
      },
      {
        icon: 'i-lucide-radio',
        title: 'Wait for a reply',
        text: 'The next step waits for a status message where online is true, and saves its status and battery.'
      },
      {
        icon: 'i-lucide-git-branch',
        title: 'Branch on the answer',
        text: 'The condition takes the true output when status is ready, otherwise it raises an alert.'
      },
      {
        icon: 'i-lucide-repeat',
        title: 'Repeat',
        text: 'The whole chain runs twice, 2 s apart. Change this in Chain settings when no step is selected.'
      }
    ]
  },
  {
    id: 'complete',
    label: 'Complete tour',
    description:
      'A firmware update that uses every feature: all variable types, replies, branches and repeat.',
    icon: 'i-lucide-graduation-cap',
    build: buildCompleteExample,
    tour: [
      {
        icon: 'i-lucide-text-cursor-input',
        title: 'Every kind of variable',
        text: 'When it starts, the chain asks for a device (text), a version (text), a channel (a list: stable, beta or nightly) and whether to force the update (true or false). Each send also gets a fresh UUID.'
      },
      {
        icon: 'i-lucide-radio',
        title: 'Two ways to accept a reply',
        text: 'The status reply must have online set to true (a field match). The progress reply only needs to contain the text “state” (a text match).'
      },
      {
        icon: 'i-lucide-bookmark-plus',
        title: 'Saved values',
        text: 'battery and firmware come from the status reply, and installed comes from the progress reply. Later steps reuse them, as $n$battery$ or $s$installed$.'
      },
      {
        icon: 'i-lucide-git-branch',
        title: 'Three kinds of condition',
        text: 'battery greater than 20 (a number check on a saved value), state equals done (a field of the last message), and firmware exists (a presence check whose false output is left empty to end that branch).'
      },
      {
        icon: 'i-lucide-git-fork',
        title: 'Parallel branches',
        text: 'After the status reply, the update path and the dashboard path run at the same time.'
      },
      {
        icon: 'i-lucide-timer',
        title: 'Pauses and repeat',
        text: 'A 2 s pause lets the device reboot, and the whole chain runs twice, 3 s apart.'
      },
      {
        icon: 'i-lucide-pencil',
        title: 'Try changing it',
        text: 'Select the status step and lower the battery in “Reply used by Simulate” to 10, or change the progress reply’s state to “failed”, then simulate again to see the other branches.'
      }
    ]
  }
]
