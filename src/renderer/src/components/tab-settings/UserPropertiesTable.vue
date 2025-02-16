<script setup lang="ts">
import { QTableProps } from 'quasar'

export type UserProperties = { key: string; value: string }[]

const userProperties = defineModel<UserProperties>('userProperties')

const columns: QTableProps['columns'] = [
  {
    name: 'key',
    label: 'Key',
    field: 'key',
    align: 'left'
  },
  {
    name: 'value',
    label: 'Value',
    field: 'value',
    align: 'left'
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'right',
    field: 'actions'
  }
]

const addUserProperty = () => {
  if (!userProperties.value) {
    return
  }

  userProperties.value.push({
    key: '',
    value: ''
  })
}

const updateUserProperty = (key: string, value: string) => {
  if (!userProperties.value) {
    return
  }

  const index = userProperties.value.findIndex((o) => o.key === key)

  if (index === -1) {
    return
  }

  userProperties.value[index].key = key
  userProperties.value[index].value = value
}

const deleteUserProperty = (key: string) => {
  if (!userProperties.value) {
    return
  }

  const index = userProperties.value.findIndex((o) => o.key === key)

  if (index === -1) {
    return
  }

  userProperties.value.splice(index, 1)
}
</script>

<template>
  <q-card bordered flat>
    <q-table
      v-if="userProperties"
      :rows="userProperties"
      :columns="columns"
      wrap-cells
      dense
      flat
      :hide-pagination="true"
      :rows-per-page-options="[0]"
      no-data-label="No user properties"
    >
      <template #top-left>
        <q-th class="full-width">User properties</q-th>
      </template>
      <template #top-right>
        <q-btn flat dense color="accent" @click="addUserProperty">
          <q-icon class="tw-mr-2" name="add" />
          Add
        </q-btn>
      </template>
      <template #body="props">
        <q-tr :props="props" class="tw-py-2">
          <q-td>
            <q-input
              v-model="props.row.key"
              placeholder="Key"
              filled
              dense
              @input="updateUserProperty(props.row.key, props.row.value)"
            />
          </q-td>
          <q-td>
            <q-input
              v-model="props.row.value"
              placeholder="Value"
              filled
              dense
              @input="updateUserProperty(props.row.key, props.row.value)"
            />
          </q-td>
          <q-td class="tw-text-end">
            <q-btn
              flat
              dense
              icon="delete"
              color="red"
              @click="deleteUserProperty(props.row.key)"
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </q-card>
</template>

<style scoped lang="less"></style>
