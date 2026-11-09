<script setup lang="ts">
import ActionDialog from '@renderer/components/tab-actions/dialogs/ActionDialog.vue'
import PublishHistoryList, { SentMessage } from './PublishHistoryList.vue'
import { useSettingsStore } from '@renderer/store/settings-store'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useActionsStore } from '@renderer/store/actions'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { Action } from '../../../../../types/actions'
import { matchTopics } from '@renderer/assets/js/mqtt'
import SavedActionRow from './SavedActionRow.vue'
import PublishForm from './PublishForm.vue'

const props = defineProps<{ clientKey: string; topic: string }>()

const emit = defineEmits<{ published: [topic: string] }>()

const mqttTopicsStore = useMqttTopicsStore()
const mqttConnectionsStore = useMqttConnectionsStore()
const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()

const formRef = useTemplateRef('formRef')

const showActions = ref(settingsStore.autoOpenPublishActions)
const editedAction = ref<Action>()
const actionDialogOpened = ref(false)

const publishTopic = computed({
  get: () => mqttTopicsStore.selectedPublishTopic,
  set: (value: string) => mqttTopicsStore.setSelectedPublishTopic(value)
})

watch(
  () => props.topic,
  (topic) => {
    if (publishTopic.value !== topic) publishTopic.value = topic
  },
  { immediate: true }
)

const actions = computed(() =>
  actionsStore
    .getConnectionActions(props.clientKey)
    .filter((action) => matchTopics(action.topic, publishTopic.value))
)

const sent = computed<SentMessage[]>(() =>
  (mqttTopicsStore.topicsPublishMessages[props.clientKey]?.[publishTopic.value] ?? [])
    .slice()
    .reverse()
    .map((message) => ({ topic: publishTopic.value, message }))
)

const editAction = (action: Action) => {
  editedAction.value = action
  actionDialogOpened.value = true
}
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <section v-if="actions.length" aria-label="Actions for this topic" class="flex flex-col gap-2">
      <div class="flex items-center">
        <span class="text-muted text-xs font-semibold">Saved actions for this topic</span>
        <UButton
          :label="showActions ? 'Hide' : `Show ${actions.length}`"
          size="xs"
          variant="link"
          class="ml-auto px-0 font-semibold"
          @click="showActions = !showActions"
        />
      </div>
      <template v-if="showActions">
        <SavedActionRow
          v-for="action in actions"
          :key="action.id"
          :action="action"
          :client-key="clientKey"
          :topic="publishTopic"
          @edit="editAction(action)"
          @sent="emit('published', publishTopic)"
        />
      </template>
      <div class="text-muted mt-1 flex items-center gap-2 text-xs">
        <span class="h-px flex-1 bg-(--ui-border)" />
        or write a message
        <span class="h-px flex-1 bg-(--ui-border)" />
      </div>
    </section>

    <PublishForm
      ref="formRef"
      v-model:topic="publishTopic"
      :client-key="clientKey"
      mode="topic"
      @published="emit('published', $event)"
    />

    <PublishHistoryList
      :items="sent"
      :can-convert="!mqttConnectionsStore.isTemporary(clientKey)"
      @load="formRef?.load($event.message)"
      @convert="formRef?.openConvert($event.message, $event.topic)"
    />

    <ActionDialog
      v-model:opened="actionDialogOpened"
      variable-completion
      edit-mode
      :action="editedAction"
      :connection-id="clientKey"
      @update:action="actionsStore.updateAction(clientKey, $event.groupId, $event)"
      @close="editedAction = undefined"
    />
  </div>
</template>
