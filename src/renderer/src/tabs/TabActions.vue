<script setup lang="ts">
import SelectConnectionAndGroupDialog from '../components/tab-actions/dialogs/SelectConnectionAndGroupDialog.vue'
import { Action, ActionGroup, ExportActionsFile, ExportGroupsFile } from '../../../types/actions'
import ActionGroupDialog from '../components/tab-actions/dialogs/ActionGroupDialog.vue'
import ActionDialog from '../components/tab-actions/dialogs/ActionDialog.vue'
import ActionGroupCard from '../components/tab-actions/ActionGroupCard.vue'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import ConnectionSelect from '../components/ConnectionSelect.vue'
import ActionCard from '../components/tab-actions/ActionCard.vue'
import { ElectronApi } from '../assets/js/electron-api'
import { useActionsStore } from '../store/actions'
import draggable from 'vuedraggable'
import { computed, ref } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const actionsStore = useActionsStore()

const actionGroupDialogOpened = ref<boolean>(false)
const actionDialogOpened = ref<boolean>(false)
const splitterModel = ref<number>(400)

const editActionGroup = ref<ActionGroup | undefined>()
const editAction = ref<Action | undefined>()

const moveActionCurrentGroupId = ref<string>('default')
const moveActionDialogOpened = ref<boolean>(false)
const moveActionConnectionId = ref<string | undefined>()
const moveActionActionId = ref<string | undefined>()
const moveActionGroupId = ref<string>('default')
const moveActionType = ref<'copy' | 'move'>('copy')

const isDraggingAction = ref<boolean>(false)

const handleMoveAction = () => {
  if (!moveActionConnectionId.value || !moveActionActionId.value || !moveActionGroupId.value) return

  const action = actionsStore.getAction(moveActionActionId.value)

  if (!action) return

  actionsStore.addActionToConnectionGroup(
    action,
    moveActionConnectionId.value,
    moveActionGroupId.value
  )

  if (moveActionType.value === 'move') {
    actionsStore.deleteActionFromConnectionGroup(
      moveActionActionId.value,
      moveActionConnectionId.value,
      moveActionCurrentGroupId.value
    )
  }
}

const selectedConnection = computed({
  get: () => actionsStore.selectedConnection,
  set: (value) => {
    actionsStore.setSelectedConnection(value)
  }
})

const selectedConnectionStatus = computed(() => {
  return mqttConnectionsStore.getConnectionStatus(selectedConnection.value)
})

const selectedActionGroup = computed({
  get: () => actionsStore.selectedActionGroup,
  set: (value) => actionsStore.setSelectedActionGroup(value)
})

const actions = computed({
  get: () => actionsStore.selectedConnectionGroupActions,
  set: (value) => actionsStore.setSelectedConnectionGroupActions(value)
})

const groups = computed({
  get: () => actionsStore.selectedConnectionGroups,
  set: (value) => actionsStore.setSelectedConnectionGroups(value)
})

const dragOptions = computed(() => {
  return { animation: 200, group: 'mqtt-connections', ghostClass: 'ghost' }
})

const handleImport = () => {
  ElectronApi.importData([{ name: 'JSON', extensions: ['json'] }])
}

const handleActionsExport = (groupId: string) => {
  const data = {
    version: 1,
    type: 'actions',
    actions: actionsStore.getSelectedConnectionGroupActions(groupId)
  } as ExportActionsFile

  ElectronApi.exportData('mq3t-actions.json', JSON.parse(JSON.stringify(data)), [
    { name: 'JSON', extensions: ['json'] }
  ])
}

const handleGroupExport = (groupId: string) => {
  let group: ActionGroup | undefined

  if (groupId === 'default') {
    group = { id: 'default', name: 'Exported Default' }
  } else {
    group = actionsStore.getConnectionGroup(actionsStore.selectedConnection, groupId)
  }

  const actionsRecord = actionsStore.getConnectionGroupActionsRecord(
    actionsStore.selectedConnection,
    groupId
  )

  if (!group) return

  const data = {
    version: 1,
    type: 'groups',
    groups: [group],
    actions: actionsRecord
  } as ExportGroupsFile

  ElectronApi.exportData('mq3t-group.json', JSON.parse(JSON.stringify(data)), [
    { name: 'JSON', extensions: ['json'] }
  ])
}

const handleConnectionExport = () => {
  const data = {
    version: 1,
    type: 'groups',
    groups: actionsStore.selectedConnectionGroups,
    actions: actionsStore.selectedConnectionGroupActionsRecord
  } as ExportGroupsFile

  ElectronApi.exportData('mq3t-groups-actions.json', JSON.parse(JSON.stringify(data)), [
    { name: 'JSON', extensions: ['json'] }
  ])
}

const handleActionDropped = (actionId: string, groupId: string) => {
  const action = actionsStore.getAction(actionId)

  if (!action) return

  actionsStore.addActionToConnectionGroup(action, actionsStore.selectedConnection, groupId)
  actionsStore.deleteActionFromConnectionGroup(
    actionId,
    actionsStore.selectedConnection,
    action.groupId
  )
}
</script>

<template>
  <q-splitter
    v-model="splitterModel"
    class="tw-h-full tw-max-h-full"
    :limits="[400, 500]"
    unit="px"
    reverse
  >
    <template #before>
      <div class="tw-h-full tw-grid" style="grid-template-rows: auto auto 1fr">
        <div class="tw-p-4 tw-flex tw-justify-between tw-items-center">
          <h1 class="tw-text-xl tw-font-bold">Actions</h1>
          <q-btn
            color="primary"
            :disable="!selectedActionGroup || !selectedConnection"
            @click="actionDialogOpened = true"
          >
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-plus" />
            Add Action
          </q-btn>
        </div>
        <q-separator />
        <div class="tw-relative">
          <transition
            appear
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
          >
            <div
              v-if="!actionsStore.selectedConnection"
              class="tw-absolute tw-right-28 tw-top-4 tw-flex tw-gap-4"
            >
              <div class="tw-mt-3 tw-text-center tw-rotate-[-2deg]">
                <h2 class="tw-text-xl">No Connection selected yet!</h2>
                <h3 class="tw-text-sm color-details">Select one to start using Actions.</h3>
              </div>
            </div>
          </transition>
          <transition
            appear
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
          >
            <div
              v-if="
                actionsStore.selectedConnection &&
                !actionsStore.selectedConnectionGroupActions.length
              "
              class="tw-absolute tw-right-28 tw-top-4 tw-flex tw-gap-4"
            >
              <div class="tw-mt-3 tw-text-center tw-rotate-[-2deg]">
                <h2 class="tw-text-xl">You don't have any Action yet?</h2>
                <h3 class="tw-text-sm color-details">Feel free to create one here!</h3>
              </div>
            </div>
          </transition>
          <div
            v-if="
              !actionsStore.selectedConnection ||
              !actionsStore.selectedConnectionGroupActions.length
            "
            class="tw-absolute tw-right-12 tw-top-4 tw-flex tw-gap-4"
            :class="[
              { 'no-connection-selected': !actionsStore.selectedConnection },
              { 'no-actions': actionsStore.selectedConnection }
            ]"
          >
            <q-icon
              name="fa-solid fa-reply"
              size="xl"
              class="create-action-arrow tw-text-primary tw-rotate-[55deg]"
            />
          </div>

          <draggable
            v-model="actions"
            v-bind="dragOptions"
            handle=".drag-handle"
            class="tw-relative actions-cards-grid tw-p-4 tw-gap-4 tw-overflow-auto"
            item-key="clientKey"
          >
            <template #item="{ element }">
              <action-card
                :key="element.id"
                :action="element"
                :send-disabled="selectedConnectionStatus !== 'connected'"
                @edit="
                  () => {
                    editAction = element
                    actionDialogOpened = true
                  }
                "
                @delete="actionsStore.deleteAction(element.id)"
                @send="actionsStore.sendAction(element)"
                @copy="
                  () => {
                    moveActionCurrentGroupId = selectedActionGroup
                    moveActionDialogOpened = true
                    moveActionActionId = element.id
                    moveActionType = 'copy'
                  }
                "
                @move="
                  () => {
                    moveActionCurrentGroupId = selectedActionGroup
                    moveActionDialogOpened = true
                    moveActionActionId = element.id
                    moveActionType = 'move'
                  }
                "
                @dragstart="$event.dataTransfer.setData('actionId', element.id)"
              />
            </template>
          </draggable>
        </div>
      </div>
    </template>

    <template #after>
      <div class="tw-h-full tw-grid" style="grid-template-rows: auto auto auto auto 1fr auto auto">
        <connection-select
          v-model="selectedConnection"
          @update:model-value="moveActionConnectionId = $event"
        />
        <q-separator />
        <div class="tw-p-3 tw-flex tw-justify-between tw-items-center">
          <h2 class="tw-text-xl">Groups</h2>
          <q-btn
            color="primary"
            :disable="!selectedConnection"
            @click="actionGroupDialogOpened = true"
          >
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-plus" />
            Add Group
          </q-btn>
        </div>
        <q-separator />
        <div class="tw-p-3 tw-flex tw-flex-col tw-gap-2 tw-overflow-auto">
          <draggable
            v-model="groups"
            v-bind="dragOptions"
            group="groups"
            handle=".drag-handle"
            class="tw-relative tw-flex tw-flex-col tw-gap-2 tw-overflow-auto"
            item-key="id"
            @start="isDraggingAction = true"
            @end="isDraggingAction = false"
          >
            <template #item="{ element }">
              <action-group-card
                :title="element.name"
                :description="element.description"
                :key="element.id"
                :active="selectedActionGroup === element.id"
                :disable-drop-zone="isDraggingAction"
                @add-action="
                  () => {
                    actionsStore.setSelectedActionGroup(element.id)
                    actionDialogOpened = true
                  }
                "
                @edit="
                  () => {
                    editActionGroup = element
                    actionGroupDialogOpened = true
                  }
                "
                @delete="actionsStore.deleteActionGroup(element.id)"
                @action:dropped="handleActionDropped($event, element.id)"
                @export:actions="handleActionsExport(element.id)"
                @export:group="handleGroupExport(element.id)"
                @click.stop="selectedActionGroup = element.id"
              />
            </template>
          </draggable>
          <action-group-card
            v-if="selectedConnection"
            cant-modify
            not-movable
            title="Default"
            description="This action group cannot be deleted."
            :active="selectedActionGroup === 'default'"
            :disable-drop-zone="isDraggingAction"
            @add-action="
              () => {
                actionsStore.setSelectedActionGroup('default')
                actionDialogOpened = true
              }
            "
            @action:dropped="handleActionDropped($event, 'default')"
            @export:actions="handleActionsExport('default')"
            @export:group="handleGroupExport('default')"
            @click.stop="selectedActionGroup = 'default'"
          />
        </div>
        <q-separator />
        <div class="tw-flex">
          <q-btn flat square class="tw-w-full tw-text-teal-500" @click="handleImport">
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-download" />
            Import
          </q-btn>
          <q-separator vertical />
          <q-btn
            flat
            square
            class="tw-w-full tw-text-teal-500"
            :disable="!selectedConnection"
            @click="handleConnectionExport"
          >
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-upload" />
            Export
          </q-btn>
        </div>
      </div>
    </template>
  </q-splitter>
  <action-dialog
    v-model:opened="actionDialogOpened"
    :edit-mode="!!editAction"
    :action="editAction"
    @create:action="actionsStore.addAction($event)"
    @update:action="actionsStore.updateAction($event)"
    @close="editAction = undefined"
  />
  <action-group-dialog
    v-model:opened="actionGroupDialogOpened"
    :edit-mode="!!editActionGroup"
    :action-group="editActionGroup"
    @create:action-group="actionsStore.addActionGroup($event)"
    @update:action-group="actionsStore.updateActionGroup($event)"
    @close="editActionGroup = undefined"
  />
  <select-connection-and-group-dialog
    v-model:connection-id="moveActionConnectionId"
    v-model:opened="moveActionDialogOpened"
    v-model:group-id="moveActionGroupId"
    :title="moveActionType === 'copy' ? 'Copy Action' : 'Move Action'"
    :action-title="moveActionType === 'copy' ? 'Copy' : 'Move'"
    :action-icon="moveActionType === 'copy' ? 'fa-solid fa-copy' : 'fa-solid fa-right-left'"
    @input="handleMoveAction"
  />
</template>

<style scoped lang="less">
@keyframes noConnectionIconAnimation {
  0% {
    transform: rotate(125deg) translateY(0px);
  }
  50% {
    transform: rotate(135deg) translateY(0px) translateX(-10px);
  }
  100% {
    transform: rotate(125deg) translateY(0px);
  }
}

@keyframes noActionsIconAnimation {
  0% {
    transform: rotate(65deg) translateY(0px);
  }
  50% {
    transform: rotate(75deg) translateY(0px) translateX(-10px);
  }
  100% {
    transform: rotate(65deg) translateY(0px);
  }
}

.no-connection-selected .create-action-arrow {
  animation: noConnectionIconAnimation 1s infinite;
  transform-origin: center center;
}

.no-actions .create-action-arrow {
  animation: noActionsIconAnimation 1s infinite;
  transform-origin: center center;
}

.actions-cards-grid {
  @apply tw-grid tw-grid-cols-1 md:tw-grid-cols-1 lg:tw-grid-cols-1 xl:tw-grid-cols-2 2xl:tw-grid-cols-3;
}
</style>
