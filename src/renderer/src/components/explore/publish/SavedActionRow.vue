<script setup lang="ts">
import { getPayloadVariablesGrouped } from '@renderer/assets/js/actions-variables'
import { useActionSend } from '@renderer/composables/useActionSend'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { payloadKind } from '@renderer/assets/js/payload-insight'
import { useActionsStore } from '@renderer/store/actions'
import { Action } from '../../../../../types/actions'
import TopicTypeTile from '../TopicTypeTile.vue'
import { computed } from 'vue'

const props = defineProps<{ action: Action; clientKey: string; topic: string }>()

const emit = defineEmits<{ edit: []; sent: [] }>()

const mqttConnectionsStore = useMqttConnectionsStore()
const actionsStore = useActionsStore()

const actionSend = useActionSend()

const variables = computed(() =>
  getPayloadVariablesGrouped(props.action.payload).flatMap((group) =>
    group.variables.map((variable) => variable.name)
  )
)

const groupName = computed(() => {
  if (props.action.groupId === 'default') return 'Default'

  return (
    actionsStore.getConnectionGroups(props.clientKey).find((g) => g.id === props.action.groupId)
      ?.name ?? 'Default'
  )
})

const topicParts = computed(() => props.action.topic.split(/([+#])/))

const isWildcard = computed(() => /[+#]/.test(props.action.topic))

const connected = computed(
  () => mqttConnectionsStore.getConnectionStatus(props.clientKey) === 'connected'
)

const kind = computed(() => {
  if (props.action.payloadFormat === 'json') return 'json'

  return payloadKind(props.action.payload)
})

const send = async () => {
  if (await actionSend.send(props.clientKey, props.action, [props.topic])) emit('sent')
}
</script>

<template>
  <div class="border-default flex items-center gap-2.5 rounded-lg border px-3 py-2.5">
    <TopicTypeTile :kind="kind" size="sm" />
    <div class="min-w-0 flex-1">
      <div class="truncate text-[13px] font-bold" :title="action.description || action.name">
        {{ action.name }}
      </div>
      <div class="text-muted truncate font-mono text-xs">
        <template v-if="isWildcard">
          from
          <template v-for="(part, index) in topicParts" :key="index">
            <span
              v-if="part === '+' || part === '#'"
              class="bg-primary/10 text-primary rounded-xs px-1 font-bold"
              >{{ part }}</span
            >
            <template v-else>{{ part }}</template>
          </template>
        </template>
        <template v-else>exact topic</template>
        · {{ groupName }}
      </div>
    </div>
    <span
      v-for="variable in variables.slice(0, 2)"
      :key="variable"
      class="bg-primary/10 text-primary hidden shrink-0 rounded-full px-2 py-0.5 font-mono text-xs font-bold sm:inline"
    >
      {{ variable }}
    </span>
    <UTooltip text="Edit action">
      <UButton
        icon="i-lucide-pencil"
        size="xs"
        color="neutral"
        variant="ghost"
        aria-label="Edit action"
        class="text-muted"
        @click="emit('edit')"
      />
    </UTooltip>
    <UButton
      label="Send"
      size="sm"
      variant="outline"
      class="font-semibold"
      :disabled="!connected"
      @click="send"
    />
  </div>
</template>
