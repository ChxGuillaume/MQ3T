<script setup lang="ts">
import SelectConnectionAndGroupDialog from './tab-actions/dialogs/SelectConnectionAndGroupDialog.vue'
import { ExportActionsFile, ExportGroupsFile } from '../../../types/actions'
import { validateAction } from '../assets/js/validate-action'
import { ElectronApi } from '../assets/js/electron-api'
import { useActionsStore } from '../store/actions'
import { useQuasar } from 'quasar'
import { ref } from 'vue'

const actionsStore = useActionsStore()
const $q = useQuasar()

const actions = ref<ExportActionsFile['actions']>([])

const importActionsDialogOpened = ref<boolean>(false)
const connectionId = ref<string | undefined>()
const groupId = ref<string>('default')

const notifyWrongFile = () => {
  $q.notify({
    message: 'Wrong file format',
    type: 'negative',
    position: 'top',
    timeout: 1000
  })
}

ElectronApi.handleImportData((_, rawData) => {
  const data = JSON.parse(rawData) as ExportActionsFile

  if (!data.version) return
  if (data.type !== 'actions') return
  if (!data.actions) return

  for (const action of data.actions) {
    const validAction = validateAction(action)

    if (!validAction) {
      console.warn('Invalid action', action)
      notifyWrongFile()
      return
    }
  }

  actions.value = data.actions
  importActionsDialogOpened.value = true
})

const handleImportActions = () => {
  if (!connectionId.value || !groupId.value) return

  for (const action of actions.value) {
    actionsStore.addActionToConnectionGroup(action, connectionId.value, groupId.value)
  }
}
</script>

<template>
  <select-connection-and-group-dialog
    v-model:connection-id="connectionId"
    v-model:opened="importActionsDialogOpened"
    v-model:group-id="groupId"
    title="Import Actions"
    action-title="Import"
    action-icon="fa-solid fa-download"
    @input="handleImportActions"
  />
</template>

<style scoped lang="less"></style>
