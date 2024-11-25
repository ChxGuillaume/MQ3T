<script setup>
import { computed, ref } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import ActionDialog from '@renderer/components/tab-actions/dialogs/ActionDialog.vue'
import NodeIcon from '@renderer/components/tab-actions/action-chain/NodeIcon.vue'

const props = defineProps(['id', 'data'])
defineEmits(['copy', 'remove'])

const { updateNodeData } = useVueFlow()

const actionDialogOpened = ref(false)

const action = computed({
  get: () => props.data.action,
  set: (action) => updateNodeData(props.id, { action })
})

const isRunning = computed(() => {
  return props.data.isRunning
})

const isFinished = computed(() => {
  return props.data.isFinished
})
</script>

<template>
  <div class="tw-w-full tw-h-full tw-p-1 tw-flex tw-flex-col tw-justify-around">
    <div class="tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-lg">
      <node-icon :isRunning="isRunning" :isFinished="isFinished" icon="fa-solid fa-paper-plane" />
      Action
    </div>

    <q-separator />

    <div
      v-if="action"
      class="tw-min-h-[28px] tw-px-1 tw-flex tw-justify-around tw-items-center tw-gap-2"
    >
      <q-icon
        v-if="action.description"
        name="fa-solid fa-info-circle"
        class="color-details"
        size="xs"
      >
        <q-tooltip class="tw-whitespace-pre tw-text-sm" v-text="action.description" />
      </q-icon>

      <q-icon name="fa-solid fa-ranking-star" class="tw-px-1 color-details" size="xs">
        <q-tooltip class="tw-text-sm" v-text="`QoS ${action.qos}`" />
      </q-icon>

      <q-icon v-if="action.retained" name="fa-solid fa-retweet" class="color-details" size="xs">
        <q-tooltip class="tw-text-sm">Retained</q-tooltip>
      </q-icon>

      <q-icon name="fa-solid fa-file-lines" class="tw-cursor-pointer color-details" size="xs">
        <q-tooltip class="tw-text-sm" v-text="action.payload" />
      </q-icon>
    </div>
    <div v-else class="tw-min-h-[28px] tw-flex tw-justify-center tw-items-center">
      <q-btn size="sm" color="accent" flat class="tw-px-2" @click="actionDialogOpened = true">
        <q-icon name="fa-solid fa-wrench" class="tw-mr-2" size="16px" />
        Setup
      </q-btn>
    </div>
  </div>

  <q-menu context-menu>
    <q-list dense>
      <q-item class="tw-text-blue-500" clickable v-close-popup @click="actionDialogOpened = true">
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-edit" class="tw-mr-2" />
            Edit
          </div>
        </q-item-section>
      </q-item>

      <q-item
        :disable="!action"
        class="tw-text-amber-500"
        clickable
        v-close-popup
        @click="$emit('copy')"
      >
        <q-item-section>
          <div class="tw-flex tw-items-center tw-gap-2">
            <q-icon name="fa-solid fa-copy" class="tw-mr-2" />
            Copy
          </div>
        </q-item-section>
      </q-item>

      <q-item class="tw-text-red-500" clickable v-close-popup @click="$emit('remove')">
        <q-item-section>
          <div class="tw-flex tw-items-center tw-gap-2">
            <q-icon name="fa-solid fa-trash" class="tw-mr-2" />
            Delete
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>

  <action-dialog
    v-model:opened="actionDialogOpened"
    :edit-mode="!!action"
    :action="action"
    no-wildcard
    no-title
    @create:action="action = $event"
    @update:action="action = $event"
  />

  <Handle type="source" :position="Position.Right" />
  <Handle type="target" :position="Position.Left" />
</template>
