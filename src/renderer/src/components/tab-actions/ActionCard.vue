<script setup lang="ts">
import { formatTile, isWildcardTopic, topicParts, wildcardTargets } from './action-utils'
import type { ContextMenuItem, DropdownMenuItem } from '@nuxt/ui'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useActionSend } from '@renderer/composables/useActionSend'
import { useToast } from '@nuxt/ui/composables'
import { Action } from '../../../../types/actions'
import { computed } from 'vue'

const MAX_TARGETS = 8

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

const enumSummary = (name: string) => {
  const options = props.action.enumOptions?.[name]

  return options?.length ? `${name}: ${options.join(' · ')}` : name
}

const variables = computed(() => {
  const names = new Set<string>()
  const regex = /\$(?:s|n|b|enum)\$([a-zA-Z0-9_ -]+)\$/g

  for (const match of props.action.payload.matchAll(regex)) names.add(match[1])

  return Array.from(names).map(enumSummary)
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

      <pre
        class="bg-muted m-0 line-clamp-4 overflow-hidden rounded-md px-2.5 py-2 font-mono text-xs leading-[18px] break-all whitespace-pre-wrap"
        >{{ action.payload || ' ' }}</pre>

      <div class="mt-auto flex flex-wrap items-center gap-1.5">
        <span class="bg-muted text-muted rounded-full px-2.5 py-0.5 text-xs"
          >QoS {{ action.qos }}</span
        >
        <span v-if="action.retained" class="bg-muted text-muted rounded-full px-2.5 py-0.5 text-xs">
          Retain
        </span>
        <span
          v-for="variable in variables"
          :key="variable"
          class="bg-primary/10 text-primary max-w-full truncate rounded-full px-2 py-0.5 font-mono text-xs font-bold"
          :title="variable"
        >
          {{ variable }}
        </span>

        <template v-if="isWildcard && !disableWildcard">
          <span class="bg-muted text-muted ml-auto rounded-full px-2.5 py-0.5 text-xs">
            {{ targets.length }} topic{{ targets.length === 1 ? '' : 's' }}
          </span>
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
                class="font-semibold"
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
            class="ml-auto font-semibold"
            :disabled="sendDisabled"
            @click="sendTo([action.topic])"
          />
        </UTooltip>
      </div>
    </article>
  </UContextMenu>
</template>
