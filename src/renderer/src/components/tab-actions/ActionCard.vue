<script setup lang="ts">
import {
  formatTile,
  hasGeneratedUuid,
  isWildcardTopic,
  topicParts,
  variableFields,
  wildcardTargets
} from './action-utils'
import type { ContextMenuItem, DropdownMenuItem } from '@nuxt/ui'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useActionSend } from '@renderer/composables/useActionSend'
import { useToast } from '@nuxt/ui/composables'
import { Action } from '../../../../types/actions'
import { computed } from 'vue'

const MAX_TARGETS = 8
const MAX_ENUM_CHIPS = 6

const VARIABLE_TYPES = {
  string: { icon: 'i-lucide-type', label: 'text' },
  number: { icon: 'i-lucide-hash', label: 'number' },
  boolean: { icon: 'i-lucide-toggle-left', label: 'boolean' },
  enum: { icon: 'i-lucide-list', label: 'list' },
  uuidV4: { icon: 'i-lucide-fingerprint', label: 'generated' }
} as const

const props = defineProps<{
  action: Action
  connectionId: string
  disableDisconnected?: boolean
  disableWildcard?: boolean
  noGrab?: boolean
  noContextMenu?: boolean
  hideTopic?: boolean
  editOnly?: boolean
}>()

const emit = defineEmits(['send', 'edit', 'copy', 'move', 'delete'])

const mqttTopicsStore = useMqttTopicsStore()
const toast = useToast()
const { send } = useActionSend()

const tile = computed(() => formatTile(props.action.payloadFormat))

const isWildcard = computed(() => isWildcardTopic(props.action.topic))

const VARIABLE_REGEX = /\$(?:s|n|b|enum)\$([a-zA-Z0-9_ -]+)\$|\$uuid\$v4\$/g

const payloadSegments = computed(() => {
  const payload = props.action.payload
  const segments: { text: string; variable?: boolean }[] = []
  let cursor = 0

  for (const match of payload.matchAll(VARIABLE_REGEX)) {
    if (match.index > cursor) segments.push({ text: payload.slice(cursor, match.index) })
    segments.push({ text: match[1] ?? 'uuid', variable: true })
    cursor = match.index + match[0].length
  }

  if (cursor < payload.length) segments.push({ text: payload.slice(cursor) })

  return segments
})

const variables = computed(() => {
  const seen = new Set<string>()
  const rows: {
    key: string
    name: string
    type: keyof typeof VARIABLE_TYPES
    options: (string | number)[]
  }[] = []

  for (const field of variableFields(props.action)) {
    const key = `${field.type}:${field.name}`

    if (seen.has(key)) continue
    seen.add(key)
    rows.push({ key, name: field.name, type: field.type, options: field.options })
  }

  if (hasGeneratedUuid(props.action.payload)) {
    rows.push({ key: 'uuid', name: 'uuid', type: 'uuidV4', options: [] })
  }

  return rows
})

const targets = computed(() => {
  if (!isWildcard.value) return []

  return wildcardTargets(
    props.action.topic,
    mqttTopicsStore.getConnectionTopics(props.connectionId)
  )
})

const sendDisabled = computed(() => props.disableDisconnected || props.disableWildcard)

const sendTooltip = computed(() => {
  if (props.disableDisconnected) return 'Connection is not active'
  if (props.disableWildcard) return 'Wildcard topics are only supported in Explore'
  return undefined
})

const sendTo = async (topics: string[], editableTopic = false) => {
  if (sendDisabled.value) return

  const sent = await send(props.connectionId, props.action, topics, editableTopic)

  if (sent) emit('send')
}

const copyText = (text: string, title: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.add({ title, icon: 'i-lucide-clipboard-check', duration: 1000 }))
    .catch(() =>
      toast.add({ title: 'Failed to copy', color: 'error', icon: 'i-lucide-circle-alert' })
    )
}

const sendMenuItems = computed<DropdownMenuItem[][]>(() => {
  const selected = mqttTopicsStore.selectedPublishTopic
  const topics = targets.value.slice(0, MAX_TARGETS)

  return [
    [
      {
        type: 'label',
        label: targets.value.length ? 'Matching topics' : 'No matching topic seen yet'
      },
      ...topics.map((topic) => ({
        label: topic,
        suffix: topic === selected ? 'selected in Explore' : undefined,
        onSelect: () => sendTo([topic])
      }))
    ],
    [
      ...(targets.value.length > 1
        ? [{ label: `Send to all ${targets.value.length}`, onSelect: () => sendTo(targets.value) }]
        : []),
      { label: 'Type another topic…', onSelect: () => sendTo([props.action.topic], true) }
    ]
  ]
})

const menuItems = computed<ContextMenuItem[][]>(() => {
  const items: ContextMenuItem[][] = [
    [{ label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => emit('edit') }],
    [
      {
        label: 'Copy topic',
        icon: 'i-lucide-clipboard',
        onSelect: () => copyText(props.action.topic, 'Topic copied')
      },
      {
        label: 'Copy payload',
        icon: 'i-lucide-clipboard-list',
        onSelect: () => copyText(props.action.payload, 'Payload copied')
      }
    ]
  ]

  if (props.editOnly) return items

  items.splice(1, 0, [
    { label: 'Copy to…', icon: 'i-lucide-copy', onSelect: () => emit('copy') },
    { label: 'Move to…', icon: 'i-lucide-arrow-right-left', onSelect: () => emit('move') }
  ])
  items.push([
    { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => emit('delete') }
  ])

  return items
})
</script>

<template>
  <UContextMenu :items="menuItems" :disabled="noContextMenu">
    <article
      class="border-default bg-default relative flex h-full flex-col gap-2.5 rounded-lg border p-3.5"
    >
      <div class="flex items-start gap-2.5">
        <span
          class="drag-handle border-default flex size-7 shrink-0 items-center justify-center rounded-sm border font-mono text-[11px] font-bold"
          :class="[tile.class, { 'cursor-grab': !noGrab }]"
        >
          {{ tile.glyph }}
        </span>
        <div class="min-w-0 flex-1">
          <button
            type="button"
            class="block max-w-full truncate text-left font-bold hover:underline"
            :title="action.description || action.name"
            @click="emit('edit')"
          >
            {{ action.name }}
          </button>
          <div
            v-if="!hideTopic"
            class="text-primary truncate font-mono text-xs"
            :title="action.topic"
          >
            <span
              v-for="(part, index) in topicParts(action.topic)"
              :key="index"
              :class="{ 'bg-primary/10 rounded-xs px-1 font-bold': part.wildcard }"
            >
              {{ part.text }}
            </span>
          </div>
        </div>
        <UDropdownMenu v-if="!noContextMenu" :items="menuItems" :content="{ align: 'end' }">
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-ellipsis"
            aria-label="More"
            class="-mt-1 -mr-1"
          />
        </UDropdownMenu>
      </div>

      <div class="bg-muted h-[88px] shrink-0 rounded-md px-2.5 py-2">
        <pre
          class="m-0 line-clamp-4 overflow-hidden font-mono text-xs leading-[18px] break-all whitespace-pre-wrap"
        ><template v-for="(segment, index) in payloadSegments" :key="index"><span
          v-if="segment.variable"
          class="bg-primary/10 text-primary rounded-xs px-0.5 font-bold"
        >{{ segment.text }}</span><template v-else>{{ segment.text }}</template></template></pre>
      </div>

      <div class="mt-auto flex items-center gap-1.5">
        <div class="text-muted flex min-w-0 items-center gap-1.5 text-xs">
          <span class="shrink-0">QoS {{ action.qos }}</span>
          <template v-if="action.retained">
            <span class="text-dimmed">·</span>
            <span class="shrink-0">Retain</span>
          </template>
          <template v-if="variables.length">
            <span class="text-dimmed">·</span>
            <UPopover
              mode="hover"
              :open-delay="150"
              :content="{ side: 'top', align: 'start' }"
              :ui="{ content: 'w-72 p-0' }"
            >
              <span
                class="text-primary flex min-w-0 cursor-default items-center gap-1 font-semibold"
              >
                <UIcon name="i-lucide-variable" class="size-3.5 shrink-0" />
                <span class="truncate">
                  {{ variables.length }} variable{{ variables.length === 1 ? '' : 's' }}
                </span>
              </span>
              <template #content>
                <div class="border-default flex items-center border-b px-3 py-2">
                  <span class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
                    Variables
                  </span>
                  <span class="text-dimmed ml-auto text-xs">{{ variables.length }}</span>
                </div>
                <ul class="divide-default flex max-h-72 flex-col divide-y overflow-y-auto text-xs">
                  <li
                    v-for="variable in variables"
                    :key="variable.key"
                    class="flex flex-col gap-1.5 px-3 py-2"
                  >
                    <div class="flex min-w-0 items-center gap-2">
                      <UIcon
                        :name="VARIABLE_TYPES[variable.type].icon"
                        class="text-muted size-3.5 shrink-0"
                      />
                      <span class="truncate font-mono font-semibold" :title="variable.name">
                        {{ variable.name }}
                      </span>
                      <span class="text-muted ml-auto shrink-0">
                        {{ VARIABLE_TYPES[variable.type].label }}
                      </span>
                    </div>
                    <div v-if="variable.type === 'enum'" class="flex flex-wrap gap-1 pl-5.5">
                      <span
                        v-for="option in variable.options.slice(0, MAX_ENUM_CHIPS)"
                        :key="String(option)"
                        class="border-default max-w-full truncate rounded-sm border px-1.5 py-px"
                        :class="typeof option === 'number' ? 'text-code-num font-mono' : ''"
                      >
                        {{ option }}
                      </span>
                      <span
                        v-if="variable.options.length > MAX_ENUM_CHIPS"
                        class="text-muted self-center"
                      >
                        +{{ variable.options.length - MAX_ENUM_CHIPS }}
                      </span>
                      <span v-if="!variable.options.length" class="text-warning">
                        No options defined
                      </span>
                    </div>
                  </li>
                </ul>
              </template>
            </UPopover>
          </template>
          <template v-if="isWildcard && !disableWildcard">
            <span class="text-dimmed">·</span>
            <span class="shrink-0">
              {{ targets.length }} topic{{ targets.length === 1 ? '' : 's' }}
            </span>
          </template>
        </div>

        <template v-if="isWildcard && !disableWildcard">
          <UDropdownMenu
            :items="sendMenuItems"
            :disabled="sendDisabled"
            :content="{ align: 'end' }"
            :ui="{ content: 'w-[300px]', itemLabel: 'font-mono text-xs' }"
          >
            <UTooltip :text="sendTooltip" :disabled="!sendTooltip">
              <UButton
                color="primary"
                variant="outline"
                size="sm"
                icon="i-lucide-send"
                trailing-icon="i-lucide-chevron-down"
                label="Send to"
                class="ml-auto shrink-0 font-semibold"
                :disabled="sendDisabled"
              />
            </UTooltip>
          </UDropdownMenu>
        </template>
        <UTooltip v-else :text="sendTooltip" :disabled="!sendTooltip">
          <UButton
            color="primary"
            variant="outline"
            size="sm"
            icon="i-lucide-send"
            label="Send"
            class="ml-auto shrink-0 font-semibold"
            :disabled="sendDisabled"
            @click="sendTo([action.topic])"
          />
        </UTooltip>
      </div>
    </article>
  </UContextMenu>
</template>
