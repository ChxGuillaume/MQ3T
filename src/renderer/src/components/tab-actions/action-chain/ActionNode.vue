<script setup>
import { computed, ref } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import ActionDialog from '@renderer/components/tab-actions/dialogs/ActionDialog.vue'
import NodeIcon from '@renderer/components/tab-actions/action-chain/NodeIcon.vue'

const props = defineProps(['id', 'data', 'connectionId'])
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
  <div class="flex h-full w-full flex-col justify-around p-1">
    <div class="flex items-center justify-center gap-2 text-lg">
      <node-icon :is-running="isRunning" :is-finished="isFinished" icon="fa-solid fa-paper-plane" />
      Action
    </div>

    <q-separator />

    <div v-if="action" class="flex min-h-[28px] items-center justify-around gap-2 px-1">
      <q-icon name="fa-solid fa-exchange-alt" class="color-details cursor-pointer" size="xs">
        <q-tooltip class="text-sm">{{ action.topic }}</q-tooltip>
      </q-icon>

      <q-icon
        v-if="action.description"
        name="fa-solid fa-info-circle"
        class="color-details"
        size="xs"
      >
        <q-tooltip class="text-sm whitespace-pre">{{ action.description }}</q-tooltip>
      </q-icon>

      <q-icon name="fa-solid fa-ranking-star" class="color-details px-1" size="xs">
        <q-tooltip class="text-sm">{{ `QoS ${action.qos}` }}</q-tooltip>
      </q-icon>

      <q-icon v-if="action.retained" name="fa-solid fa-retweet" class="color-details" size="xs">
        <q-tooltip class="text-sm">Retained</q-tooltip>
      </q-icon>

      <q-icon name="fa-solid fa-file-lines" class="color-details cursor-pointer" size="xs">
        <q-tooltip class="text-sm">{{ action.payload }}</q-tooltip>
      </q-icon>
    </div>
    <div v-else class="flex min-h-[28px] items-center justify-center">
      <q-btn size="sm" color="accent" flat class="px-2" @click="actionDialogOpened = true">
        <q-icon name="fa-solid fa-wrench" class="mr-2" size="16px" />
        Setup
      </q-btn>
    </div>
  </div>

  <q-menu context-menu>
    <q-list dense>
      <q-item v-close-popup class="text-blue-500" clickable @click="actionDialogOpened = true">
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-edit" class="mr-2" />
            Edit
          </div>
        </q-item-section>
      </q-item>

      <q-item
        v-close-popup
        :disable="!action"
        class="text-amber-500"
        clickable
        @click="$emit('copy')"
      >
        <q-item-section>
          <div class="flex items-center gap-2">
            <q-icon name="fa-solid fa-copy" class="mr-2" />
            Copy
          </div>
        </q-item-section>
      </q-item>

      <q-item v-close-popup class="text-red-500" clickable @click="$emit('remove')">
        <q-item-section>
          <div class="flex items-center gap-2">
            <q-icon name="fa-solid fa-trash" class="mr-2" />
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
    :connection-id="connectionId"
    no-wildcard
    no-title
    @create:action="action = $event"
    @update:action="action = $event"
  />

  <Handle type="source" :position="Position.Right" />
  <Handle type="target" :position="Position.Left" />
</template>
