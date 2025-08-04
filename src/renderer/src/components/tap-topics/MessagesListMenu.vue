<script setup lang="ts">
import { exportMessages } from '@renderer/assets/js/export-messages'
import { useSettingsStore } from '@renderer/store/settings-store'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed } from 'vue'

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const selectedMessageCompare = computed({
  get: () => settingsStore.selectedMessageCompare,
  set: (val) => {
    settingsStore.setSelectedMessageCompare(val)
  }
})

const messagesPaginationSetting = computed({
  get: () => settingsStore.messagesPagination,
  set: (val) => {
    settingsStore.setMessagesPagination(val)
  }
})
</script>

<template>
  <q-menu :offset="[0, 5]" anchor="bottom right" self="top right">
    <q-list dense>
      <q-item class="custom-padding-left" v-ripple>
        <q-item-section>
          <q-checkbox v-model="selectedMessageCompare" size="xs">
            <span class="tw-pl-1">Compare</span>
          </q-checkbox>
        </q-item-section>

        <q-tooltip :offset="[5, 0]" anchor="center left" self="center right">
          Compare selected messages with the last message in the list.
        </q-tooltip>
      </q-item>

      <q-item class="custom-padding-left" v-ripple>
        <q-item-section>
          <q-checkbox v-model="messagesPaginationSetting" size="xs">
            <span class="tw-pl-1">Pagination</span>
          </q-checkbox>
        </q-item-section>

        <q-tooltip :offset="[5, 0]" anchor="center left" self="center right">
          Paginate the messages list.
        </q-tooltip>
      </q-item>

      <q-separator />

      <q-item class="tw-text-accent" clickable>
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-file-arrow-down" class="tw-mr-2" />
            Export
          </div>
        </q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right" color="accent" />
        </q-item-section>

        <q-menu anchor="top end" self="top start" class="tw-w-28">
          <q-list dense>
            <q-item
              clickable
              v-ripple
              @click="exportMessages('raw', mqttTopicsStore.getSelectedTopicMessages)"
            >
              <q-item-section>
                <div>
                  <q-icon name="reorder" class="tw-mr-2" />
                  RAW
                </div>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-ripple
              @click="exportMessages('json', mqttTopicsStore.getSelectedTopicMessages)"
            >
              <q-item-section>
                <div>
                  <q-icon name="data_object" class="tw-mr-2" />
                  JSON
                </div>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-ripple
              @click="exportMessages('csv', mqttTopicsStore.getSelectedTopicMessages)"
            >
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-file-csv" class="tw-mr-2" />
                  CSV
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>
    </q-list>
  </q-menu>
</template>

<style scoped lang="less">
.custom-padding-left {
  padding-left: 8px !important;
}
</style>
