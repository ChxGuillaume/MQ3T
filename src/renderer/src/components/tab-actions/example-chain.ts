import { Action, ChainAction, ChainActionNode } from '../../../../types/actions'
import { Edge } from '@vue-flow/core'
import { v4 as uuidV4 } from 'uuid'

const exampleAction = (name: string, topic: string, payload: string): Action => ({
  id: `example-${uuidV4()}`,
  groupId: 'default',
  name,
  topic,
  qos: 0,
  retained: false,
  payload,
  payloadFormat: 'json'
})

const json = (value: unknown) => JSON.stringify(value, null, 2)

export const buildExampleChain = (): Pick<ChainAction, 'name' | 'nodes' | 'edges' | 'repeat'> => {
  const ids = {
    ask: uuidV4(),
    listen: uuidV4(),
    check: uuidV4(),
    start: uuidV4(),
    pause: uuidV4(),
    report: uuidV4(),
    alert: uuidV4()
  }

  const nodes: ChainActionNode[] = [
    { id: 'start', type: 'start', position: { x: 30, y: 150 }, deletable: false },
    {
      id: ids.ask,
      type: 'action',
      position: { x: 160, y: 140 },
      data: {
        action: exampleAction(
          'Ask the device for its status',
          'mq3t/example/$s$device$/get',
          json({ requestId: '$uuid$v4$' })
        )
      }
    },
    {
      id: ids.listen,
      type: 'wait-message',
      position: { x: 440, y: 140 },
      data: {
        topic: 'mq3t/example/+/status',
        timeout: 5,
        timeoutUnit: 's',
        match: { kind: 'path', path: '$.online', value: 'true' },
        captures: [
          { name: 'status', path: '$.status' },
          { name: 'battery', path: '$.battery' }
        ],
        simulatedReply: json({ online: true, status: 'ready', battery: 82 })
      }
    },
    {
      id: ids.check,
      type: 'condition',
      position: { x: 720, y: 134 },
      data: { source: 'variable', name: 'status', operator: 'equals', value: 'ready' }
    },
    {
      id: ids.start,
      type: 'action',
      position: { x: 1000, y: 60 },
      data: {
        action: exampleAction(
          'Start the job',
          'mq3t/example/$s$device$/start',
          json({ battery: '$n$battery$' })
        )
      }
    },
    {
      id: ids.pause,
      type: 'wait',
      position: { x: 1280, y: 60 },
      data: { duration: 1, durationType: 's' }
    },
    {
      id: ids.report,
      type: 'action',
      position: { x: 1460, y: 60 },
      data: {
        action: exampleAction(
          'Log that the job started',
          'mq3t/example/log',
          json({ device: '$s$device$', result: 'started' })
        )
      }
    },
    {
      id: ids.alert,
      type: 'action',
      position: { x: 1000, y: 220 },
      data: {
        action: exampleAction(
          'Raise an alert',
          'mq3t/example/alerts',
          json({ device: '$s$device$', status: '$s$status$' })
        )
      }
    }
  ]

  const edge = (source: string, target: string, sourceHandle?: string): Edge => ({
    id: uuidV4(),
    source,
    target,
    sourceHandle,
    animated: true
  })

  return {
    name: 'Example: check a device, then start a job',
    nodes,
    edges: [
      edge('start', ids.ask),
      edge(ids.ask, ids.listen),
      edge(ids.listen, ids.check),
      edge(ids.check, ids.start, 'true'),
      edge(ids.start, ids.pause),
      edge(ids.pause, ids.report),
      edge(ids.check, ids.alert, 'false')
    ],
    repeat: { count: 2, interval: 2, intervalUnit: 's' }
  }
}

export const EXAMPLE_TOUR: { icon: string; title: string; text: string }[] = [
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
