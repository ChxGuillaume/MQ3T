<script setup lang="ts">
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import ConnectionStatusChip from '../components/ConnectionStatusChip.vue'
import ActionGroupCard from '../components/tab-actions/ActionGroupCard.vue'
import ActionCard from '../components/tab-actions/ActionCard.vue'
import { ref } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()

const splitterModel = ref<number>(400)

const selectedConnection = ref<string | undefined>(undefined)
const selectedActionGroup = ref<string | undefined>('default')

const connectionSelectOptions = mqttConnectionsStore.connections.map((connection) => {
  return {
    label: connection.name,
    value: connection.clientKey
  }
})
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
          <q-btn color="primary" :disable="!selectedActionGroup || !selectedConnection">
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-plus" />
            Add Action
          </q-btn>
        </div>
        <q-separator />
        <div class="actions-cards-grid tw-p-4 tw-gap-4 tw-overflow-auto">
          <action-card
            v-for="x in selectedConnection && 50"
            :key="x"
            :title="`My Action - Group ${selectedActionGroup}`"
          />
        </div>
      </div>
    </template>

    <template #after>
      <div class="tw-h-full tw-grid" style="grid-template-rows: auto auto auto auto 1fr auto auto">
        <q-select
          v-model="selectedConnection"
          filled
          square
          label="Connection"
          :options="connectionSelectOptions"
        >
          <template #selected-item="{ opt }">
            <div class="tw-w-full tw-flex tw-justify-between tw-items-center tw-gap-2">
              <span class="tw-line-clamp-1">{{ opt.label }}</span>
              <connection-status-chip
                :connection-status="mqttConnectionsStore.getConnectionStatus(opt.value)"
                size="xs"
              />
            </div>
          </template>

          <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section>
                <div class="tw-flex tw-justify-between tw-items-center tw-gap-2">
                  <span class="tw-line-clamp-1">{{ opt.label }}</span>
                  <connection-status-chip
                    :connection-status="mqttConnectionsStore.getConnectionStatus(opt.value)"
                    size="xs"
                  />
                </div>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
        <q-separator />
        <div class="tw-p-3 tw-flex tw-justify-between tw-items-center">
          <h2 class="tw-text-xl">Groups</h2>
          <q-btn color="primary" :disable="!selectedConnection">
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-plus" />
            Add Group
          </q-btn>
        </div>
        <q-separator />
        <div class="tw-p-3 tw-flex tw-flex-col tw-gap-2 tw-overflow-auto">
          <action-group-card
            v-for="x in selectedConnection && 5"
            :title="`My Group ${x}`"
            description="This is a description of the group. It can be multiple lines long. And it can be very long. Very very long. But it will be truncated."
            :key="x"
            :active="selectedActionGroup === `${x}`"
            @click.stop="selectedActionGroup = `${x}`"
          />
          <action-group-card
            v-if="selectedConnection"
            cant-modify
            title="Default"
            description="This action group cannot be deleted."
            :active="selectedActionGroup === 'default'"
            @click.stop="selectedActionGroup = 'default'"
          />
        </div>
        <q-separator />
        <div class="tw-flex">
          <q-btn flat square class="tw-w-full tw-text-teal-500">
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-download" />
            Import
          </q-btn>
          <q-separator vertical />
          <q-btn flat square class="tw-w-full tw-text-teal-500" :disable="!selectedConnection">
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-upload" />
            Export
          </q-btn>
        </div>
      </div>
    </template>
  </q-splitter>
</template>

<style scoped lang="less">
.actions-cards-grid {
  @apply tw-grid tw-grid-cols-1 md:tw-grid-cols-1 lg:tw-grid-cols-1 xl:tw-grid-cols-2 2xl:tw-grid-cols-3;
}
</style>
