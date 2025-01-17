<script setup lang="ts">
import ActionVariablesDialog from '@renderer/components/tab-actions/dialogs/ActionVariablesDialog.vue'
import { getPayloadVariablesCount, actionsVariables } from '@renderer/assets/js/actions-variables'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import ActionCardContextMenu from './ActionCardContextMenu.vue'
import { useActionsStore } from '@renderer/store/actions'
import { Action } from '../../../../types/actions'
import { computed, ref } from 'vue'
import { v4 as uuidV4 } from 'uuid'
import { useQuasar } from 'quasar'

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
const actionsStore = useActionsStore()

const $q = useQuasar()

const variablesDialogOpened = ref(false)

const variablesCount = computed(() => {
  return getPayloadVariablesCount(props.action.payload)
})

const publishTopic = computed({
  get: () => mqttTopicsStore.selectedPublishTopic,
  set: (value) => mqttTopicsStore.setSelectedPublishTopic(value)
})

const handleCopyTopic = () => {
  navigator.clipboard.writeText(props.action.topic)

  $q.notify({
    message: 'Topic copied to clipboard',
    type: 'positive',
    timeout: 1000
  })
}

const handleCopyPayload = () => {
  navigator.clipboard.writeText(props.action.payload)

  $q.notify({
    message: 'Payload copied to clipboard',
    type: 'positive',
    timeout: 1000
  })
}

const send = () => {
  if (props.disableDisconnected) return

  if (variablesCount.value) {
    variablesDialogOpened.value = true
    return
  }

  emit('send')

  const actionCopy = { ...props.action }

  let uuid = uuidV4()
  if (props.action.payloadFormat === 'json') uuid = JSON.stringify(uuid)

  actionCopy.payload = actionCopy.payload.replace(actionsVariables.uuidV4.regex, uuid)

  actionsStore.sendAction(props.connectionId, actionCopy, publishTopic.value)
}
</script>

<template>
  <q-card flat class="action-card tw-h-fit tw-p-4">
    <div class="tw-flex tw-justify-between">
      <h2
        class="truncate-hover-one-line drag-handle tw-w-full tw-text-lg"
        :class="{ 'tw-cursor-grab': !noGrab }"
        :title="action.name"
      >
        {{ action.name }}
      </h2>
      <q-btn
        v-if="!noContextMenu"
        class="tw-ml-2"
        icon="fa-solid fa-ellipsis-vertical"
        flat
        round
        size="sm"
      >
        <action-card-context-menu
          :edit-only="editOnly"
          @edit="$emit('edit')"
          @copy="$emit('copy')"
          @move="$emit('move')"
          @delete="$emit('delete')"
        />
      </q-btn>
    </div>
    <p
      v-if="!hideTopic"
      class="truncate-hover-one-line color-details tw-cursor-pointer"
      :title="action.topic"
      @click="handleCopyTopic"
    >
      {{ action.topic }}
    </p>
    <div class="tw-mt-4 tw-flex tw-justify-between">
      <div class="tw-flex tw-gap-4">
        <q-icon
          v-if="variablesCount"
          name="fa-solid fa-code"
          class="color-details tw-mt-2"
          size="xs"
        >
          <q-tooltip class="tw-text-sm">{{ variablesCount }} variables</q-tooltip>
        </q-icon>

        <q-icon
          v-if="action.description"
          name="fa-solid fa-info-circle"
          class="color-details tw-mt-2"
          size="xs"
        >
          <q-tooltip class="tw-whitespace-pre tw-text-sm" v-text="action.description" />
        </q-icon>

        <q-icon name="fa-solid fa-ranking-star" class="color-details tw-mt-2 tw-px-1" size="xs">
          <q-tooltip class="tw-text-sm" v-text="`QoS ${action.qos}`" />
        </q-icon>

        <q-icon
          v-if="action.retained"
          name="fa-solid fa-retweet"
          class="color-details tw-mt-2"
          size="xs"
        >
          <q-tooltip class="tw-text-sm">Retained</q-tooltip>
        </q-icon>

        <q-icon
          name="fa-solid fa-file-lines"
          class="color-details tw-mt-2 tw-cursor-pointer"
          size="xs"
          @click="handleCopyPayload"
        >
          <q-tooltip class="tw-text-sm" v-text="action.payload" />
        </q-icon>
      </div>
      <q-btn color="primary" :disable="disableDisconnected || disableWildcard" @click="send">
        <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-paper-plane" />
        Send
        <q-tooltip v-if="disableDisconnected" class="tw-bg-primary tw-text-sm tw-text-white">
          Connection is not active.
        </q-tooltip>
        <q-tooltip v-if="disableWildcard" class="tw-bg-primary tw-text-sm tw-text-white">
          Wildcard topics are only supported in the Topics tab.
        </q-tooltip>
      </q-btn>
    </div>

    <action-card-context-menu
      v-if="!noContextMenu"
      :edit-only="editOnly"
      context-menu
      anchor="bottom left"
      self="top left"
      @edit="$emit('edit')"
      @copy="$emit('copy')"
      @move="$emit('move')"
      @delete="$emit('delete')"
    />
    <action-variables-dialog
      v-model:opened="variablesDialogOpened"
      :connection-id="connectionId"
      :action="action"
    />
  </q-card>
</template>

<style scoped lang="less">
.truncate-hover-one-line {
  @apply tw-line-clamp-1 tw-overflow-hidden tw-text-ellipsis tw-break-all;
}

.body--light {
  .action-card {
    @apply tw-bg-neutral-100;
  }
}
</style>
