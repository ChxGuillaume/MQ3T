<script setup lang="ts">
import { ActionGroup } from '../../../../../types/actions'
import { reactive, ref, watch } from 'vue'
import { v4 as uuidV4 } from 'uuid'
import { QForm } from 'quasar'

const formRef = ref<QForm | null>(null)

const props = defineProps<{
  opened: boolean
  editMode?: boolean
  actionGroup?: ActionGroup
}>()

const emits = defineEmits<{
  'update:opened': [value: boolean]
  'create:actionGroup': [value: ActionGroup]
  'update:actionGroup': [value: ActionGroup]
  close: []
}>()

const form = reactive({
  name: '',
  description: ''
})

const rules = {
  name: [(v: string) => !!v || 'Title is required']
}

const clearForm = () => {
  form.name = ''
  form.description = ''
}

const handleCloseForm = () => {
  clearForm()
  emits('close')
  emits('update:opened', false)
}

const validateForm = async (): Promise<boolean> => {
  return (await formRef.value?.validate()) || false
}

const handleCreate = async () => {
  if (!(await validateForm())) return

  emits('create:actionGroup', {
    id: `action-group-${uuidV4()}`,
    name: form.name,
    description: form.description
  })

  handleCloseForm()
}

const handleUpdate = async () => {
  if (!props.actionGroup) return
  if (!(await validateForm())) return

  emits('update:actionGroup', {
    id: props.actionGroup.id,
    name: form.name,
    description: form.description
  })

  handleCloseForm()
}

watch(
  () => props.opened && props.actionGroup,
  (actionGroup) => {
    if (!actionGroup) return

    form.name = actionGroup.name
    form.description = actionGroup.description!
  }
)
</script>

<template>
  <q-dialog ref="dialogRef" :model-value="opened" @hide="handleCloseForm">
    <q-card flat class="tw-min-w-[400px]">
      <q-card-section>
        <q-form ref="formRef" class="tw-grid tw-gap-2">
          <h2 class="tw-mb-2 tw-text-xl">Action Group</h2>
          <q-input v-model="form.name" filled label="Title" :rules="rules.name" />
          <q-input v-model="form.description" filled label="Description" type="textarea" />
        </q-form>
      </q-card-section>
      <q-card-actions align="right">
        <div class="tw-flex tw-gap-2">
          <q-btn flat label="Cancel" @click="handleCloseForm" />
          <q-btn v-if="!editMode" color="primary" @click="handleCreate">
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-plus" />
            Create
          </q-btn>
          <q-btn v-else color="primary" @click="handleUpdate">
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-save" />
            Update
          </q-btn>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="less"></style>
