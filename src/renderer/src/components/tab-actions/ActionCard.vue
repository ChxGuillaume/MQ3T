<script setup lang="ts">
import ActionCardContextMenu from './ActionCardContextMenu.vue'
import { Action } from '../../../../types/actions'
import { useQuasar } from 'quasar'

const props = defineProps<{
  action: Action
  disableDisconnected?: boolean
  disableWildcard?: boolean
  noGrab?: boolean
  noContextMenu?: boolean
  hideTopic?: boolean
  editOnly?: boolean
}>()

defineEmits(['send', 'edit', 'copy', 'move', 'delete'])

const $q = useQuasar()

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
</script>

<template>
  <q-card flat class="action-card tw-p-4 tw-h-fit">
    <div class="tw-flex tw-justify-between">
      <h2
        class="tw-w-full tw-text-lg truncate-hover-one-line drag-handle"
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
      class="truncate-hover-one-line tw-cursor-pointer color-details"
      :title="action.topic"
      @click="handleCopyTopic"
    >
      {{ action.topic }}
    </p>
    <div class="tw-mt-4 tw-flex tw-justify-between">
      <div class="tw-flex tw-gap-4">
        <q-icon
          v-if="action.description"
          name="fa-solid fa-info-circle"
          class="tw-mt-2 color-details"
          size="xs"
        >
          <q-tooltip class="tw-whitespace-pre tw-text-sm" v-text="action.description" />
        </q-icon>

        <q-icon name="fa-solid fa-ranking-star" class="tw-px-1 tw-mt-2 color-details" size="xs">
          <q-tooltip class="tw-text-sm" v-text="`QoS ${action.qos}`" />
        </q-icon>

        <q-icon
          v-if="action.retained"
          name="fa-solid fa-retweet"
          class="tw-mt-2 color-details"
          size="xs"
        >
          <q-tooltip class="tw-text-sm">Retained</q-tooltip>
        </q-icon>

        <q-icon
          name="fa-solid fa-file-lines"
          class="tw-mt-2 tw-cursor-pointer color-details"
          size="xs"
          @click="handleCopyPayload"
        >
          <q-tooltip class="tw-text-sm" v-text="action.payload" />
        </q-icon>
      </div>
      <q-btn
        color="primary"
        :disable="disableDisconnected || disableWildcard"
        @click="$emit('send')"
      >
        <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-paper-plane" />
        Send
        <q-tooltip v-if="disableDisconnected" class="tw-bg-primary tw-text-white tw-text-sm">
          Connection is not active.
        </q-tooltip>
        <q-tooltip v-if="disableWildcard" class="tw-bg-primary tw-text-white tw-text-sm">
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
  </q-card>
</template>

<style scoped lang="less">
.truncate-hover-one-line {
  @apply tw-text-ellipsis tw-overflow-hidden tw-break-all tw-line-clamp-1;
}

.body--light {
  .action-card {
    @apply tw-bg-neutral-100;
  }
}
</style>
