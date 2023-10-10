<script setup lang="ts">
import { Action } from '../../../../types/actions'
import { useQuasar } from 'quasar'

const props = defineProps<{
  action: Action
  sendDisabled?: boolean
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
      <p class="tw-text-lg truncate-hover-one-line" :title="action.name">
        {{ action.name }}
      </p>
      <q-btn class="tw-ml-2" icon="fa-solid fa-ellipsis-vertical" flat round size="sm">
        <q-menu anchor="bottom right" self="top right">
          <q-list class="tw-min-w-[150px]">
            <q-item class="tw-text-blue-500" clickable v-close-popup @click="$emit('edit')">
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-edit" class="tw-mr-2" />
                  Edit
                </div>
              </q-item-section>
            </q-item>
            <q-item
              class="tw-text-amber-500"
              clickable
              v-close-popup
              @click="$emit('copy')"
              disable
            >
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-copy" class="tw-mr-2" />
                  Copy
                </div>
              </q-item-section>
            </q-item>
            <q-item
              class="tw-text-amber-500"
              clickable
              v-close-popup
              @click="$emit('move')"
              disable
            >
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-right-left" class="tw-mr-2" />
                  Move
                </div>
              </q-item-section>
            </q-item>
            <q-item class="tw-text-red-500" clickable v-close-popup @click="$emit('delete')">
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-trash" class="tw-mr-2" />
                  Delete
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>
    <p
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

        <q-icon name="fa-solid fa-ranking-star" class="tw-mt-2 color-details" size="xs">
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
      <q-btn color="primary" :disable="sendDisabled" @click="$emit('send')">
        <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-paper-plane" />
        Send
      </q-btn>
    </div>
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
