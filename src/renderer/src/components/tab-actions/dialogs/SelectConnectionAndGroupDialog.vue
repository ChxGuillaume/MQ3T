<script setup lang="ts">
import { ActionGroup } from '../../../../../types/actions'
import ConnectionSelect from '../../ConnectionSelect.vue'
import { useActionsStore } from '../../../store/actions'
import { computed, ref } from 'vue'
import { QForm } from 'quasar'

const actionsStore = useActionsStore()

const formRef = ref<QForm | null>(null)

const props = defineProps<{
  title: string
  actionIcon: string
  actionTitle: string
  opened: boolean
  groupId?: string
  connectionId?: string
}>()

const emits = defineEmits<{
  'update:opened': [value: boolean]
  'update:groupId': [value: string]
  'update:connectionId': [value: string]
  input: []
  close: []
}>()

const groups = computed(() => actionsStore.getConnectionGroups(props.connectionId!))

const groupList = computed(() => {
  return [{ id: 'default', name: 'Default' } as ActionGroup, ...groups.value]
})

const formGroup = computed(() => {
  return groupList.value?.find((g) => g.id === props.groupId)
})

const handleCloseForm = () => {
  emits('close')
  emits('update:opened', false)
}

const handleSelect = async () => {
  emits('input')
  handleCloseForm()
}

const connectionIdModel = computed<string>({
  get: () => props.connectionId || '',
  set: (value) => {
    emits('update:groupId', 'default')
    emits('update:connectionId', value)
  }
})

const groupIdModel = computed<string>({
  get: () => props.groupId || 'default',
  set: (value) => emits('update:groupId', value)
})
</script>

<template>
  <q-dialog ref="dialogRef" :model-value="opened" @hide="handleCloseForm">
    <q-card flat class="tw-min-w-[400px]">
      <q-card-section>
        <q-form ref="formRef" class="tw-grid tw-gap-2">
          <h2 class="tw-mb-2 tw-text-xl">{{ title }}</h2>
          <connection-select v-model="connectionIdModel" class="tw-w-[370px]" />
          <q-select
            v-model="groupIdModel"
            :options="groupList"
            label="Group"
            emit-value
            filled
            option-value="id"
            option-label="name"
            :display-value="formGroup?.name"
          />
        </q-form>
      </q-card-section>
      <q-card-actions align="right">
        <div class="tw-flex tw-gap-2">
          <q-btn flat label="Cancel" @click="handleCloseForm" />
          <q-btn color="primary" @click="handleSelect">
            <q-icon class="tw-mr-2" size="xs" :name="actionIcon" />
            {{ actionTitle }}
          </q-btn>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="less"></style>
