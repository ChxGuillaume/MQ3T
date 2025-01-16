<script setup lang="ts">
import SelectConnectionAndGroupDialog from '../components/tab-actions/dialogs/SelectConnectionAndGroupDialog.vue'
import ActionsToDefaultGroupDialog from '../components/tab-actions/dialogs/ActionsToDefaultGroupDialog.vue'
import SelectConnectionDialog from '../components/tab-actions/dialogs/SelectConnectionDialog.vue'
import ActionGroupDialog from '../components/tab-actions/dialogs/ActionGroupDialog.vue'
import ChainActionScreen from '@renderer/components/tab-actions/ChainActionScreen.vue'
import ChainActionCard from '@renderer/components/tab-actions/ChainActionCard.vue'
import ActionDialog from '../components/tab-actions/dialogs/ActionDialog.vue'
import ActionGroupCard from '../components/tab-actions/ActionGroupCard.vue'
import { useChainActionsStore } from '@renderer/store/chain-actions'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import ConnectionSelect from '../components/ConnectionSelect.vue'
import ActionCard from '../components/tab-actions/ActionCard.vue'
import SplitterIcon from '../components/SplitterIcon.vue'
import { ElectronApi } from '../assets/js/electron-api'
import { useActionsStore } from '../store/actions'
import draggable from 'vuedraggable'
import { computed, ref } from 'vue'
import { v4 as uuidV4 } from 'uuid'
import {
  ExportChainActionsFile,
  ExportActionsFile,
  ExportGroupsFile,
  ActionGroup,
  ChainAction,
  Action
} from '../../../types/actions'

const mqttConnectionsStore = useMqttConnectionsStore()
const chainActionsStore = useChainActionsStore()
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

const moveChainActionCurrentGroupId = ref<string>('default')
const moveChainActionDialogOpened = ref<boolean>(false)
const moveChainActionConnectionId = ref<string | undefined>()
const moveChainActionChainActionId = ref<string | undefined>()
const moveChainActionGroupId = ref<string>('default')
const moveChainActionType = ref<'copy' | 'move'>('copy')

const moveOrCopyActionGroup = ref({
  dialogOpened: false,
  type: 'copy' as 'copy' | 'move',
  connectionId: '',
  actionGroup: undefined as ActionGroup | undefined
})

const deleteGroupActionDialog = ref({
  dialogOpened: false,
  chainActionCount: 0,
  actionCount: 0,
  groupId: ''
})

const tab = ref<string>('list')

const isDraggingAction = ref<boolean>(false)

const copyObject = (obj: any) => {
  return JSON.parse(JSON.stringify(obj))
}

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

const handleMoveChainAction = () => {
  if (
    !moveChainActionConnectionId.value ||
    !moveChainActionChainActionId.value ||
    !moveChainActionGroupId.value
  ) {
    return
  }

  const chainAction = chainActionsStore.getChainAction(moveChainActionChainActionId.value)

  if (!chainAction) return

  chainActionsStore.copyChainAction(
    moveChainActionConnectionId.value,
    moveChainActionGroupId.value,
    chainAction
  )

  if (moveChainActionType.value === 'move') {
    chainActionsStore.deleteChainAction(
      moveChainActionConnectionId.value,
      moveChainActionCurrentGroupId.value,
      moveChainActionChainActionId.value
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

const chainActions = computed({
  get: () =>
    chainActionsStore.getGroupChainActions(
      actionsStore.selectedConnection,
      selectedActionGroup.value
    ),
  set: (value) =>
    chainActionsStore.setConnectionGroupChainActions(
      actionsStore.selectedConnection,
      selectedActionGroup.value,
      value
    )
})

const groups = computed({
  get: () => actionsStore.selectedConnectionGroups,
  set: (value) => actionsStore.setSelectedConnectionGroups(value)
})

const dragOptions = computed(() => {
  return { animation: 200, group: 'actions', ghostClass: 'ghost' }
})

const handleImport = () => {
  ElectronApi.importData([{ name: 'JSON', extensions: ['json'] }])
}

const handleChainActionsExport = (groupId: string) => {
  const data = {
    version: 1,
    type: 'chain-actions',
    chainActions: chainActionsStore.getGroupChainActions(actionsStore.selectedConnection, groupId)
  } as ExportChainActionsFile

  ElectronApi.exportData('mq3t-chain-actions.json', JSON.stringify(copyObject(data)), [
    { name: 'JSON', extensions: ['json'] }
  ])
}

const handleActionsExport = (groupId: string) => {
  const data = {
    version: 1,
    type: 'actions',
    actions: actionsStore.getSelectedConnectionGroupActions(groupId)
  } as ExportActionsFile

  ElectronApi.exportData('mq3t-actions.json', JSON.stringify(copyObject(data)), [
    { name: 'JSON', extensions: ['json'] }
  ])
}

const handleGroupExport = (groupId: string) => {
  let group: ActionGroup | undefined

  if (groupId === 'default') {
    group = { id: `group-${uuidV4()}`, name: 'Exported Default' }
  } else {
    group = actionsStore.getConnectionGroup(actionsStore.selectedConnection, groupId)
  }

  const actionsRecord = actionsStore.getConnectionGroupActionsRecord(
    actionsStore.selectedConnection,
    groupId
  )

  const chainActions = chainActionsStore.getGroupChainActionsRecord(
    actionsStore.selectedConnection,
    groupId
  )

  if (!group) return

  const data = {
    version: 1,
    type: 'groups',
    groups: [group],
    actions: actionsRecord,
    chainActions: chainActions
  } as ExportGroupsFile

  ElectronApi.exportData('mq3t-group.json', JSON.stringify(copyObject(data)), [
    { name: 'JSON', extensions: ['json'] }
  ])
}

const handleConnectionExport = () => {
  const allChainActions = copyObject(
    chainActionsStore.getConnectionChainActions(actionsStore.selectedConnection)
  )

  const allActions = copyObject(actionsStore.selectedConnectionGroupActionsRecord)
  const allGroups = [...actionsStore.selectedConnectionGroups]

  if (allActions['default']?.length || allChainActions['default']?.length) {
    const groupId = `group-${uuidV4()}`

    allGroups.push({ id: groupId, name: 'Exported Default' })

    if (allActions['default']) {
      allActions[groupId] = allActions['default'].map((action) => {
        return { ...action, groupId }
      })

      delete allActions['default']
    }

    if (allChainActions['default']) {
      allChainActions[groupId] = allChainActions['default'].map((chainAction) => {
        return { ...chainAction, groupId }
      })

      delete allChainActions['default']
    }
  }

  const data = {
    version: 1,
    type: 'groups',
    groups: allGroups,
    actions: allActions,
    chainActions: allChainActions
  } as ExportGroupsFile

  ElectronApi.exportData('mq3t-groups-actions.json', JSON.stringify(copyObject(data)), [
    { name: 'JSON', extensions: ['json'] }
  ])
}

const handleDeleteGroup = (groupId: string) => {
  const actionsCount = actionsStore.getSelectedConnectionGroupActions(groupId).length
  const chainActionsCount = chainActionsStore.getGroupChainActions(
    actionsStore.selectedConnection,
    groupId
  ).length

  if (actionsCount === 0 && chainActionsCount === 0) {
    actionsStore.deleteActionGroup(groupId)
    chainActionsStore.deleteGroupChainActions(actionsStore.selectedConnection, groupId)
    return
  }

  deleteGroupActionDialog.value.dialogOpened = true
  deleteGroupActionDialog.value.groupId = groupId

  deleteGroupActionDialog.value.chainActionCount = chainActionsCount
  deleteGroupActionDialog.value.actionCount = actionsCount
}

const handleDeleteGroupDialog = (moveToDefault: boolean) => {
  actionsStore.deleteActionGroup(deleteGroupActionDialog.value.groupId, moveToDefault)
  chainActionsStore.deleteGroupChainActions(
    actionsStore.selectedConnection,
    deleteGroupActionDialog.value.groupId,
    moveToDefault
  )
}

const handleDropped = (id: string, groupId: string) => {
  if (id.startsWith('action-')) {
    handleActionDropped(id, groupId)
  } else if (id.startsWith('chain-action-')) {
    handleChainActionDropped(id, groupId)
  }
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

const handleChainActionDropped = (chainActionId: string, groupId: string) => {
  const chainAction = chainActionsStore.getChainAction(chainActionId)

  if (!chainAction) return

  chainActionsStore.copyChainAction(actionsStore.selectedConnection, groupId, chainAction)
  chainActionsStore.deleteChainAction(
    actionsStore.selectedConnection,
    chainAction.groupId,
    chainAction.id
  )
}

const handleMoveOrCopyActionGroup = (actionGroup: ActionGroup, action: 'copy' | 'move') => {
  moveOrCopyActionGroup.value.connectionId = actionsStore.selectedConnection

  moveOrCopyActionGroup.value.type = action
  moveOrCopyActionGroup.value.actionGroup = actionGroup

  moveOrCopyActionGroup.value.dialogOpened = true
}

const handleMoveOrCopyActionGroupDialog = () => {
  if (!moveOrCopyActionGroup.value.connectionId || !moveOrCopyActionGroup.value.actionGroup) return

  const actionGroupCopy = copyObject(moveOrCopyActionGroup.value.actionGroup)
  const currentConnectionId = actionsStore.selectedConnection
  const connectionId = moveOrCopyActionGroup.value.connectionId

  const chainActions = copyObject(
    chainActionsStore.getGroupChainActions(actionsStore.selectedConnection, actionGroupCopy.id)
  )
  const actions = copyObject(actionsStore.getSelectedConnectionGroupActions(actionGroupCopy.id))

  const newActionGroup = actionsStore.addActionGroupToConnection(actionGroupCopy, connectionId)

  for (const chainAction of chainActions) {
    chainActionsStore.addChainAction(connectionId, newActionGroup.id, chainAction)
  }

  for (const action of actions) {
    actionsStore.addActionToConnectionGroup(action, connectionId, newActionGroup.id)
  }

  if (moveOrCopyActionGroup.value.type === 'move') {
    chainActionsStore.deleteGroupChainActions(currentConnectionId, actionGroupCopy.id, false)
    actionsStore.deleteActionGroupFromConnection(currentConnectionId, actionGroupCopy.id)
  }
}

const handleStartDrag = (ev: DragEvent, actionId: string) => {
  ev.dataTransfer?.setData('actionId', actionId)
}

const chainActionEdit = ref<ChainAction | undefined>()
</script>

<template>
  <q-tab-panels
    v-model="tab"
    class="tw-h-full tw-bg-transparent"
    animated
    vertical
    transition-prev="jump-up"
    transition-next="jump-down"
  >
    <q-tab-panel class="tw-p-0" name="list">
      <q-splitter
        v-model="splitterModel"
        class="tw-h-full tw-max-h-full"
        :limits="[400, 500]"
        unit="px"
        reverse
      >
        <template #before>
          <div class="tw-grid tw-h-full" style="grid-template-rows: auto auto 1fr">
            <div class="tw-flex tw-items-center tw-justify-end tw-p-4">
              <q-btn-group>
                <q-btn color="primary" :disable="!selectedActionGroup || !selectedConnection">
                  <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-plus" />
                  Create New

                  <q-menu anchor="bottom right" self="top right">
                    <q-list>
                      <q-item clickable v-close-popup @click="actionDialogOpened = true">
                        <q-item-section>
                          <div>
                            <q-icon class="tw-mr-2" name="fa-solid fa-paper-plane" />
                            Action
                          </div>
                        </q-item-section>
                      </q-item>
                      <q-item clickable v-close-popup @click="tab = 'chain-action'">
                        <q-item-section>
                          <div>
                            <q-icon class="tw-mr-2" name="fa-solid fa-diagram-project" />
                            Chain Action
                          </div>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-btn-group>
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
                  <div class="tw-mt-3 tw-rotate-[-2deg] tw-text-center">
                    <h2 class="tw-text-xl">No Connection selected yet!</h2>
                    <h3 class="color-details tw-text-sm">Select one to start using Actions.</h3>
                  </div>
                </div>
              </transition>
              <transition
                appear
                enter-active-class="animated fadeIn"
                leave-active-class="animated fadeOut"
              >
                <div
                  v-if="actionsStore.selectedConnection && !actions.length && !chainActions.length"
                  class="tw-absolute tw-right-28 tw-top-4 tw-flex tw-gap-4"
                >
                  <div class="tw-mt-3 tw-rotate-[-2deg] tw-text-center">
                    <h2 class="tw-text-xl">You don't have any Action yet?</h2>
                    <h3 class="color-details tw-text-sm">Feel free to create one here!</h3>
                  </div>
                </div>
              </transition>
              <div
                v-if="!actionsStore.selectedConnection || (!actions.length && !chainActions.length)"
                class="tw-absolute tw-right-12 tw-top-4 tw-flex tw-gap-4"
                :class="[
                  { 'no-connection-selected': !actionsStore.selectedConnection },
                  { 'no-actions': actionsStore.selectedConnection }
                ]"
              >
                <q-icon
                  name="fa-solid fa-reply"
                  size="xl"
                  class="create-action-arrow tw-rotate-[55deg] tw-text-primary"
                />
              </div>

              <h1 v-if="actions.length" class="tw-px-4 tw-pt-4 tw-text-xl tw-font-bold">Actions</h1>

              <draggable
                v-if="actions.length"
                v-model="actions"
                v-bind="dragOptions"
                group="actions"
                handle=".drag-handle"
                class="actions-cards-grid tw-relative tw-gap-4 tw-overflow-auto tw-p-4"
                item-key="clientKey"
              >
                <template #item="{ element: action }">
                  <q-intersection
                    class="tw-h-[135px]"
                    @dragstart="handleStartDrag($event, action.id)"
                  >
                    <action-card
                      :key="action.id"
                      :action="action"
                      :connection-id="selectedConnection"
                      :disable-disconnected="selectedConnectionStatus !== 'connected'"
                      :disable-wildcard="action.topic.includes('#') || action.topic.includes('+')"
                      @edit="
                        () => {
                          editAction = action
                          actionDialogOpened = true
                        }
                      "
                      @delete="actionsStore.deleteAction(action.id)"
                      @copy="
                        () => {
                          moveActionCurrentGroupId = selectedActionGroup
                          moveActionDialogOpened = true
                          moveActionActionId = action.id
                          moveActionType = 'copy'
                        }
                      "
                      @move="
                        () => {
                          moveActionCurrentGroupId = selectedActionGroup
                          moveActionDialogOpened = true
                          moveActionActionId = action.id
                          moveActionType = 'move'
                        }
                      "
                    />
                  </q-intersection>
                </template>
              </draggable>

              <q-separator v-if="actions.length && chainActions.length" />

              <h1 v-if="chainActions.length" class="tw-px-4 tw-pt-4 tw-text-xl tw-font-bold">
                Chain Actions
              </h1>

              <draggable
                v-if="chainActions.length"
                v-model="chainActions"
                v-bind="dragOptions"
                group="chain-actions"
                handle=".drag-handle"
                class="actions-cards-grid tw-relative tw-gap-4 tw-overflow-auto tw-p-4"
                item-key="clientKey"
              >
                <template #item="{ element: chainAction }">
                  <q-intersection
                    class="tw-h-[114px]"
                    @dragstart="handleStartDrag($event, chainAction.id)"
                  >
                    <chain-action-card
                      :connection-id="actionsStore.selectedConnection"
                      :chain-action="chainAction"
                      :disable="selectedConnectionStatus !== 'connected'"
                      :key="chainAction.id"
                      @copy="
                        () => {
                          moveChainActionCurrentGroupId = selectedActionGroup
                          moveChainActionDialogOpened = true
                          moveChainActionChainActionId = chainAction.id
                          moveChainActionType = 'copy'
                        }
                      "
                      @move="
                        () => {
                          moveChainActionCurrentGroupId = selectedActionGroup
                          moveChainActionDialogOpened = true
                          moveChainActionChainActionId = chainAction.id
                          moveChainActionType = 'move'
                        }
                      "
                      @edit="
                        () => {
                          chainActionEdit = chainAction
                          tab = 'chain-action'
                        }
                      "
                      @delete="
                        chainActionsStore.deleteChainAction(
                          selectedConnection,
                          selectedActionGroup,
                          chainAction.id
                        )
                      "
                    />
                  </q-intersection>
                </template>
              </draggable>
            </div>
          </div>
        </template>

        <template v-slot:separator>
          <splitter-icon vertical @click:double="splitterModel = 400" />
        </template>

        <template #after>
          <q-card
            class="tw-grid tw-h-full"
            style="grid-template-rows: auto auto auto auto 1fr auto auto"
            square
            flat
          >
            <connection-select
              v-model="selectedConnection"
              no-rules
              @update:model-value="
                (ev) => {
                  moveActionConnectionId = ev
                  moveChainActionConnectionId = ev
                  selectedActionGroup = 'default'
                }
              "
            />
            <q-separator />
            <div class="tw-flex tw-items-center tw-justify-between tw-p-3">
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
            <div class="tw-flex tw-flex-col tw-gap-2 tw-overflow-auto tw-p-3">
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
                    @edit="
                      () => {
                        editActionGroup = element
                        actionGroupDialogOpened = true
                      }
                    "
                    @delete="handleDeleteGroup(element.id)"
                    @action:dropped="handleDropped($event, element.id)"
                    @export:chain-actions="handleChainActionsExport(element.id)"
                    @export:actions="handleActionsExport(element.id)"
                    @export:group="handleGroupExport(element.id)"
                    @click.stop="selectedActionGroup = element.id"
                    @copy="handleMoveOrCopyActionGroup(element, 'copy')"
                    @move="handleMoveOrCopyActionGroup(element, 'move')"
                  />
                </template>
              </draggable>
              <action-group-card
                v-if="selectedConnection"
                cant-modify
                not-movable
                not-draggable
                title="Default"
                description="This action group cannot be deleted."
                :active="selectedActionGroup === 'default'"
                :disable-drop-zone="isDraggingAction"
                @action:dropped="handleDropped($event, 'default')"
                @export:chain-actions="handleChainActionsExport('default')"
                @export:actions="handleActionsExport('default')"
                @export:group="handleGroupExport('default')"
                @click.stop="selectedActionGroup = 'default'"
                @copy="handleMoveOrCopyActionGroup({ id: 'default', name: 'Default Copy' }, 'copy')"
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
          </q-card>
        </template>
      </q-splitter>
    </q-tab-panel>
    <q-tab-panel class="tw-p-0" name="chain-action">
      <chain-action-screen
        :chain-action="chainActionEdit"
        @back="
          () => {
            chainActionEdit = undefined
            tab = 'list'
          }
        "
      />
    </q-tab-panel>
  </q-tab-panels>

  <action-dialog
    v-model:opened="actionDialogOpened"
    variable-completion
    :edit-mode="!!editAction"
    :action="editAction"
    @create:action="actionsStore.addAction($event)"
    @update:action="actionsStore.updateSelectedActionGroupAction($event)"
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
  <select-connection-dialog
    v-model:opened="moveOrCopyActionGroup.dialogOpened"
    v-model:connection-id="moveOrCopyActionGroup.connectionId"
    :title="moveOrCopyActionGroup.type === 'copy' ? 'Copy Group' : 'Move Group'"
    :action-title="moveOrCopyActionGroup.type === 'copy' ? 'Copy' : 'Move'"
    :action-icon="
      moveOrCopyActionGroup.type === 'copy' ? 'fa-solid fa-copy' : 'fa-solid fa-right-left'
    "
    @input="handleMoveOrCopyActionGroupDialog"
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
  <select-connection-and-group-dialog
    v-model:connection-id="moveChainActionConnectionId"
    v-model:opened="moveChainActionDialogOpened"
    v-model:group-id="moveChainActionGroupId"
    :title="moveChainActionType === 'copy' ? 'Copy Chain Action' : 'Move Chain Action'"
    :action-title="moveChainActionType === 'copy' ? 'Copy' : 'Move'"
    :action-icon="moveChainActionType === 'copy' ? 'fa-solid fa-copy' : 'fa-solid fa-right-left'"
    @input="handleMoveChainAction"
  />
  <actions-to-default-group-dialog
    v-model:opened="deleteGroupActionDialog.dialogOpened"
    :chain-actions-count="deleteGroupActionDialog.chainActionCount"
    :action-count="deleteGroupActionDialog.actionCount"
    @actions:move="handleDeleteGroupDialog(true)"
    @actions:delete="handleDeleteGroupDialog(false)"
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
