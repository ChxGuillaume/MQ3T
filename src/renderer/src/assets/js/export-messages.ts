import { ElectronApi } from '@renderer/assets/js/electron-api'
import { MqttMessage } from '@renderer/store/mqtt-topics'
import Excel from 'exceljs'
import moment from 'moment'

type ExportType = 'raw' | 'json' | 'csv'

const stringifyOrReturn = (value: any) => {
  try {
    return JSON.stringify(JSON.parse(value))
  } catch (_) {
    return value
  }
}

const parseOrReturn = (value: any) => {
  try {
    return JSON.parse(value)
  } catch (_) {
    return value
  }
}

export const exportMessages = (type: ExportType, messages: MqttMessage[]) => {
  const copy = JSON.parse(JSON.stringify(messages)).sort((a: MqttMessage, b: MqttMessage) =>
    moment(a.createdAt).diff(moment(b.createdAt))
  )

  switch (type) {
    case 'raw':
      return exportRaw(copy)
    case 'json':
      return exportJson(copy)
    case 'csv':
      return exportCsv(copy)
  }
}

const exportRaw = (messages: MqttMessage[]) => {
  const data = messages
    .map((message) => {
      const formated_date = moment(message.createdAt).format()

      return `[${formated_date}] Qos: ${message.qos}, Retained: ${message.retained}, Payload: ${stringifyOrReturn(message.message)}`
    })
    .join('\n')

  ElectronApi.exportData('mq3t-exported-data.log', data, [
    { name: 'MQ3T Raw Export', extensions: ['log'] }
  ])
}

const exportJson = (messages: MqttMessage[]) => {
  const data = messages.map((message) => ({
    createdAt: moment(message.createdAt).format(),
    qos: message.qos,
    retained: message.retained,
    payload: parseOrReturn(message.message)
  }))

  ElectronApi.exportData('mq3t-exported-data.json', JSON.stringify(data), [
    { name: 'MQ3T JSON Export', extensions: ['json'] }
  ])
}

const exportCsv = async (messages: MqttMessage[]) => {
  const data = messages.map((message) => ({
    createdAt: moment(message.createdAt).format(),
    qos: message.qos,
    retained: message.retained,
    payload: message.message
  }))

  const workbook = new Excel.Workbook()
  const worksheet = workbook.addWorksheet('Messages')

  worksheet.columns = [
    { header: 'Created At', key: 'createdAt', width: 32 },
    { header: 'Qos', key: 'qos', width: 10 },
    { header: 'Retained', key: 'retained', width: 10 },
    { header: 'Payload', key: 'payload', width: 100 }
  ]

  data.forEach((d) => {
    worksheet.addRow(d)
  })

  const csvData = await workbook.csv.writeBuffer()

  ElectronApi.exportData('mq3t-exported-data.csv', csvData.toString(), [
    { name: 'MQ3T CSV Export', extensions: ['csv'] }
  ])
}
