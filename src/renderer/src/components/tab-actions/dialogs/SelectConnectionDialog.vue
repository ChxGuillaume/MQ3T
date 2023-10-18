<script setup lang="ts">
import ConnectionSelect from '../../ConnectionSelect.vue'
import { computed, ref } from 'vue'
import { QForm } from 'quasar'

const formRef = ref<QForm | null>(null)

const props = defineProps<{
  connectionId?: string
  actionTitle: string
  actionIcon: string
  opened: boolean
  title: string
}>()

const emits = defineEmits<{
  'update:connectionId': [value: string]
  'update:opened': [value: boolean]
  input: []
  close: []
}>()

const validateForm = async () => {
  return await formRef.value?.validate()
}

const handleCloseForm = () => {
  emits('close')
  emits('update:opened', false)
}

const handleSelect = async () => {
  const valid = await validateForm()

  if (!valid) return

  emits('input')
  handleCloseForm()
}

const connectionIdModel = computed<string>({
  get: () => props.connectionId || '',
  set: (value) => {
    emits('update:connectionId', value)
  }
})
</script>

<template>
  <q-dialog ref="dialogRef" :model-value="opened" @hide="handleCloseForm">
    <q-card flat class="tw-min-w-[400px]">
      <q-card-section>
        <q-form ref="formRef" class="tw-grid tw-gap-2">
          <h2 class="tw-mb-2 tw-text-xl">{{ title }}</h2>
          <connection-select v-model="connectionIdModel" class="tw-w-[370px]" />
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
