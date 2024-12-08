<script setup lang="ts">
import SelectConnectionDialog from './tab-actions/dialogs/SelectConnectionDialog.vue'
import { validateChainAction } from '@renderer/assets/js/validate-chain-action'
import { Action, ChainAction, ExportGroupsFile } from '../../../types/actions'
import { validateActionGroup } from '../assets/js/validate-action-group'
import { useChainActionsStore } from '@renderer/store/chain-actions'
import { validateAction } from '../assets/js/validate-action'
import { ElectronApi } from '../assets/js/electron-api'
import { useActionsStore } from '../store/actions'
import { useQuasar } from 'quasar'
import { ref } from 'vue'

const chainActionsStore = useChainActionsStore()
const actionsStore = useActionsStore()
const $q = useQuasar()

const chainActions = ref<ExportGroupsFile['chainActions']>({})
const actions = ref<ExportGroupsFile['actions']>({})
const groups = ref<ExportGroupsFile['groups']>([])

const importActionsDialogOpened = ref<boolean>(false)
const connectionId = ref<string | undefined>()
const groupId = ref<string>('default')

const notifyWrongFile = () => {
  $q.notify({
    message: 'Wrong file format',
    type: 'negative',
    timeout: 2000
  })
}

const notifyImportSuccess = () => {
  $q.notify({
    message: 'Imported successfully',
    type: 'positive',
    timeout: 2000
  })
}

ElectronApi.handleImportData((_, rawData) => {
  const data = JSON.parse(rawData) as ExportGroupsFile

  if (!data.version) return
  if (data.type !== 'groups') return
  if (!data.actions) return

  const chainActionsList = Object.values(data.chainActions).flat()
  const actionsList = Object.values(data.actions).flat()

  if (!validateChainActions(chainActionsList)) return
  if (!validateActions(actionsList)) return
  if (!validateGroups(data.groups)) return

  chainActions.value = data.chainActions
  actions.value = data.actions
  groups.value = data.groups

  importActionsDialogOpened.value = true
})

const validateChainActions = (chainActions: ChainAction[]) => {
  for (const chainAction of chainActions) {
    if (!validateChainAction(chainAction)) {
      console.warn('Invalid chain action', chainAction)
      notifyWrongFile()
      return false
    }
  }

  return true
}

const validateActions = (actions: Action[]) => {
  for (const action of actions) {
    const validAction = validateAction(action)

    if (!validAction) {
      console.warn('Invalid action', action)
      notifyWrongFile()
      return false
    }
  }

  return true
}

const validateGroups = (groups: ExportGroupsFile['groups']) => {
  for (const group of groups) {
    const validGroup = validateActionGroup(group)

    if (!validGroup) {
      console.warn('Invalid group', group)
      notifyWrongFile()
      return false
    }
  }

  return true
}

const handleImportActionsGroups = () => {
  if (!connectionId.value || !groupId.value) return

  for (const group of groups.value) {
    const addedGroup = actionsStore.addActionGroupToConnection(group, connectionId.value)

    const actionsList = actions.value[group.id] || []
    const chainActionsList = chainActions.value[group.id] || []

    for (const action of actionsList) {
      actionsStore.addActionToConnectionGroup(action, connectionId.value, addedGroup.id)
    }

    for (const chainAction of chainActionsList) {
      chainActionsStore.addChainAction(connectionId.value, addedGroup.id, chainAction)
    }
  }

  notifyImportSuccess()
}
</script>

<template>
  <select-connection-dialog
    v-model:connection-id="connectionId"
    v-model:opened="importActionsDialogOpened"
    title="Import Group(s)"
    action-title="Import"
    action-icon="fa-solid fa-download"
    @input="handleImportActionsGroups"
  />
</template>

<style scoped lang="less"></style>
