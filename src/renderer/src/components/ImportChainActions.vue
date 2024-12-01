<script setup lang="ts">
import SelectConnectionAndGroupDialog from './tab-actions/dialogs/SelectConnectionAndGroupDialog.vue'
import { ExportChainActionsFile } from '../../../types/actions'
import { ElectronApi } from '../assets/js/electron-api'
import { useActionsStore } from '../store/actions'
import { useQuasar } from 'quasar'
import { ref } from 'vue'
import { validateChainAction } from '@renderer/assets/js/validate-chain-action'
import { useChainActionsStore } from '@renderer/store/chain-actions'

const chainActionsStore = useChainActionsStore()
const actionsStore = useActionsStore()
const $q = useQuasar()

const chainActions = ref<ExportChainActionsFile['chainActions']>([])

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
  const data = JSON.parse(rawData) as ExportChainActionsFile

  if (!data.version) return
  if (data.type !== 'chain-actions') return
  if (!data.chainActions) return

  for (const action of data.chainActions) {
    const validAction = validateChainAction(action)

    if (!validAction) {
      console.warn('Invalid action', action)
      notifyWrongFile()
      return
    }
  }

  chainActions.value = data.chainActions
  importActionsDialogOpened.value = true
})

const handleImportActions = () => {
  if (!connectionId.value || !groupId.value) return

  for (const chainAction of chainActions.value) {
    chainActionsStore.addChainAction(connectionId.value, groupId.value, chainAction)
  }

  notifyImportSuccess()
}
</script>

<template>
  <select-connection-and-group-dialog
    v-model:connection-id="connectionId"
    v-model:opened="importActionsDialogOpened"
    v-model:group-id="groupId"
    title="Import Chain Actions"
    action-title="Import"
    action-icon="fa-solid fa-download"
    @input="handleImportActions"
  />
</template>

<style scoped lang="less"></style>
