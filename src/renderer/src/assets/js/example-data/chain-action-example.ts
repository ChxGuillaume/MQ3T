const aBase = { qos: 0, retained: false }
const ps = () => JSON.parse(JSON.stringify(aBase))
const s = (value: string) => JSON.stringify(value)

export const chainActionExampleNodes = [
  { id: 'start', type: 'start', position: { x: 30, y: 40 }, deletable: false },

  {
    id: '2',
    type: 'action',
    position: { x: 250, y: 30 },
    data: {
      action: {
        ...ps(),
        topic: 'mq3t/chain-action-one',
        payload: s('message 1')
      }
    }
  },
  { id: '5', type: 'wait', position: { x: 470, y: 30 }, data: { duration: 3000, type: 'ms' } },
  {
    id: '6',
    type: 'action',
    position: { x: 690, y: 30 },
    data: {
      action: {
        ...ps(),
        topic: 'mq3t/chain-action-three',
        payload: s('message 3')
      }
    }
  },

  { id: '3', type: 'wait', position: { x: 250, y: 180 }, data: { duration: 2000, type: 'ms' } },
  {
    id: '4',
    type: 'action',
    position: { x: 470, y: 130 },
    data: {
      action: {
        ...ps(),
        topic: 'mq3t/chain-action-two',
        payload: s('message 2.1')
      }
    }
  },
  {
    id: '7',
    type: 'action',
    position: { x: 470, y: 230 },
    data: {
      action: {
        ...ps(),
        topic: 'mq3t/chain-action-two',
        payload: s('message 2.2')
      }
    }
  }
]

export const chainActionExampleEdges = [
  { id: 'e1-2', source: 'start', target: '2', animated: true },
  { id: 'e1-3', source: 'start', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
  { id: 'e5-6', source: '5', target: '6', animated: true },
  { id: 'e2-5', source: '2', target: '5', animated: true },
  { id: 'e3-7', source: '3', target: '7', animated: true }
]
