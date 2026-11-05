import { Action } from '../../../../types/actions'
import { clone, PayloadFormat, validateTopic } from './action-utils'

export type ActionForm = {
  name: string
  description: string
  topic: string
  qos: 0 | 1 | 2
  retained: boolean
  payload: string
  payloadFormat: PayloadFormat
  responseTopic: string
  correlationData: string
  enumOptions: Record<string, (string | number)[]>
}

export type ActionFormErrors = { name?: string; topic?: string }

export const actionToForm = (
  action?: Action,
  defaultFormat: PayloadFormat = 'raw'
): ActionForm => ({
  name: action?.name ?? '',
  description: action?.description ?? '',
  topic: action?.topic ?? '',
  qos: action?.qos ?? 0,
  retained: action?.retained ?? false,
  payload: action?.payload ?? '',
  payloadFormat: action?.payloadFormat ?? defaultFormat,
  responseTopic: action?.responseTopic ?? '',
  correlationData: action?.correlationData ?? '',
  enumOptions: clone(action?.enumOptions ?? {})
})

export const formToAction = (form: ActionForm, base: Pick<Action, 'id' | 'groupId'>): Action => ({
  id: base.id,
  groupId: base.groupId,
  name: form.name,
  description: form.description,
  topic: form.topic,
  qos: form.qos,
  retained: form.retained,
  payload: form.payload,
  payloadFormat: form.payloadFormat,
  enumOptions: clone(form.enumOptions),
  responseTopic: form.responseTopic,
  correlationData: form.correlationData
})

export const validateActionForm = (
  form: ActionForm,
  options: { noTitle?: boolean; noWildcard?: boolean } = {}
): ActionFormErrors => ({
  name: !options.noTitle && !form.name.trim() ? 'Title is required' : undefined,
  topic: validateTopic(form.topic, { noWildcard: options.noWildcard })
})

export const hasErrors = (errors: ActionFormErrors) => !!(errors.name || errors.topic)
