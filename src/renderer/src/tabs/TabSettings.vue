<script setup lang="ts">
import ChangeLogsModal from '../components/ChangeLogsModal.vue'
import LicensesModal from '../components/AppDetailsModal.vue'
import { useSettingsStore } from '../store/settings-store'
import { useAppStore } from '../store/app-store'
import { useAppColorMode } from '../composables/useAppColorMode'
import { computed, ref } from 'vue'
import moment from 'moment'

const settingsStore = useSettingsStore()
const dateReference = ref(moment())
const appStore = useAppStore()

const { mode: darkMode } = useAppColorMode()

const darkModeOptions = [
  { label: 'System', value: 'auto' },
  { label: 'On', value: 'dark' },
  { label: 'Off', value: 'light' }
]

const showActivityAnimationSpeedOptions = [
  { label: 'Slower', value: 3000 },
  { label: 'Slow', value: 2000 },
  { label: 'Normal', value: 1000 },
  { label: 'Fast', value: 500 },
  { label: 'Faster', value: 250 }
]

const showActivityAnimationTypeOptions = [
  { label: 'Laser', value: 'laser' },
  { label: 'Topic Heat', value: 'topic-heat' }
]

const defaultDataFormatOptions = [
  { label: 'Raw', value: 'raw' },
  { label: 'JSON', value: 'json' },
  { label: 'XML', value: 'xml' },
  { label: 'YAML', value: 'yaml' }
]

const dateFormatOptions = computed(() => {
  const formats = [
    { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
    { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
    { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' }
  ]

  return formats.map((o) => {
    return {
      ...o,
      label: `${dateReference.value.format(o.value)} (${o.label})`
    }
  })
})

const timeFormatOptions = computed(() => {
  const formats = [
    { label: 'HH:mm:ss', value: 'HH:mm:ss' },
    { label: 'hh:mm:ss A', value: 'hh:mm:ss A' }
  ]

  return formats.map((o) => {
    return {
      ...o,
      label: `${dateReference.value.format(o.value)} (${o.label})`
    }
  })
})

const showActivitySetting = computed({
  get: () => settingsStore.showActivity,
  set: (val) => {
    settingsStore.setShowActivity(val)
  }
})

const showActivityAnimationSpeedSetting = computed({
  get: () => settingsStore.showActivityAnimationSpeed,
  set: (val) => {
    settingsStore.setShowActivityAnimationSpeed(val)
  }
})

const showActivityAnimationTypeSetting = computed({
  get: () => settingsStore.showActivityAnimationType,
  set: (val) => {
    settingsStore.setShowActivityAnimationType(val)
  }
})

const dateFormatSetting = computed({
  get: () => settingsStore.dateFormat,
  set: (val) => {
    settingsStore.setDateFormat(val)
  }
})

const timeFormatSetting = computed({
  get: () => settingsStore.timeFormat,
  set: (val) => {
    settingsStore.setTimeFormat(val)
  }
})

const maxMessagesSetting = computed({
  get: () => settingsStore.maxMessages,
  set: (val) => {
    settingsStore.setMaxMessages(val)
  }
})

const smartTopicGroupCloseSetting = computed({
  get: () => settingsStore.smartTopicGroupClose,
  set: (val) => {
    settingsStore.setSmartTopicGroupClose(val)
  }
})

const messagesPaginationSetting = computed({
  get: () => settingsStore.messagesPagination,
  set: (val) => {
    settingsStore.setMessagesPagination(val)
  }
})

const defaultDataFormatSetting = computed({
  get: () => settingsStore.defaultDataFormat,
  set: (val) => {
    settingsStore.setDefaultDataFormat(val)
  }
})

const autoOpenPublishActionsSetting = computed({
  get: () => settingsStore.autoOpenPublishActions,
  set: (val) => settingsStore.setAutoOpenPublishActions(val)
})

const showChangeLogsModal = ref(false)
const showVersionModal = ref(false)
</script>

<template>
  <div class="text-weight-medium flex justify-between bg-neutral-200 p-2 dark:bg-neutral-800">
    <div class="w-24">
      <q-btn
        size="xs"
        class="bg-white hover:bg-neutral-200 dark:bg-neutral-700"
        flat
        @click="appStore.setView('new-tab')"
      >
        <div class="flex place-items-center gap-2">
          <q-icon name="fa-solid fa-arrow-left" size="10px" />
          <span class="text-[0.65rem] leading-0">Back</span>
        </div>
      </q-btn>
    </div>

    <div class="bg-neutral-200 text-center dark:bg-neutral-800">Settings</div>

    <div class="w-24" />
  </div>

  <div class="settings">
    <div class="flex flex-col gap-6">
      <div class="settings-group">
        <h2 class="settings-group-title">App</h2>
        <hr class="settings-group-separator" />
        <div class="settings-group-item-container">
          <q-select
            v-model="darkMode"
            name="dark-mode"
            filled
            :options="darkModeOptions"
            label="Dark Mode"
            emit-value
          >
            <template #selected-item>
              {{ darkModeOptions.find((o) => o.value === darkMode)?.label }}
            </template>
          </q-select>
          <q-select
            v-model="dateFormatSetting"
            name="date-format-setting"
            filled
            class="text-white"
            :options="dateFormatOptions"
            label="Date Format"
            emit-value
          >
            <template #selected-item>
              {{ dateFormatOptions.find((o) => o.value === dateFormatSetting)?.label }}
            </template>
          </q-select>
          <q-select
            v-model="timeFormatSetting"
            name="time-format-setting"
            filled
            class="text-white"
            :options="timeFormatOptions"
            label="Time Format"
            emit-value
          >
            <template #selected-item>
              {{ timeFormatOptions.find((o) => o.value === timeFormatSetting)?.label }}
            </template>
          </q-select>
        </div>
      </div>
      <div class="settings-group">
        <h2 class="settings-group-title">Topics</h2>
        <hr class="settings-group-separator" />
        <div class="settings-group-item-container">
          <q-card class="card-toggle" square flat>
            <q-toggle
              v-model="showActivitySetting"
              name="show-activity-setting"
              label="Show Activity"
              class="w-full"
            />
          </q-card>
          <q-select
            v-model="showActivityAnimationSpeedSetting"
            name="show-activity-animation-speed-setting"
            filled
            :options="showActivityAnimationSpeedOptions"
            label="Activity Animation Speed"
            emit-value
          >
            <template #selected-item>
              {{
                showActivityAnimationSpeedOptions.find(
                  (o) => o.value === showActivityAnimationSpeedSetting
                )?.label
              }}
            </template>
          </q-select>
          <q-select
            v-model="showActivityAnimationTypeSetting"
            name="show-activity-animation-type-setting"
            filled
            :options="showActivityAnimationTypeOptions"
            label="Activity Animation Style"
            emit-value
          >
            <template #selected-item>
              {{
                showActivityAnimationTypeOptions.find(
                  (o) => o.value === showActivityAnimationTypeSetting
                )?.label
              }}
            </template>
          </q-select>
          <q-input
            v-model="maxMessagesSetting"
            name="max-messages-setting"
            filled
            label="Messages History per Topic"
            type="number"
          />
          <q-card class="card-toggle" square flat>
            <q-toggle
              v-model="smartTopicGroupCloseSetting"
              name="smart-topic-group-close-setting"
              class="w-full"
              label="Smart Topic Group"
            />
            <q-icon name="fa-solid fa-info-circle" class="mx-3">
              <q-tooltip>
                When enabled topic groups closes if they are selected and clicked again
              </q-tooltip>
            </q-icon>
          </q-card>
          <q-card class="card-toggle" square flat>
            <q-toggle
              v-model="messagesPaginationSetting"
              name="messages-pagination-setting"
              label="Messages Pagination"
              class="w-full"
            />
          </q-card>
        </div>
      </div>
      <div class="settings-group">
        <h2 class="settings-group-title">Actions</h2>
        <hr class="settings-group-separator" />
        <div class="settings-group-item-container">
          <q-select
            v-model="defaultDataFormatSetting"
            name="default-data-format-setting"
            filled
            class="text-white"
            :options="defaultDataFormatOptions"
            label="Default Data Format"
            emit-value
          >
            <template #selected-item>
              {{
                defaultDataFormatOptions.find((o) => o.value === defaultDataFormatSetting)?.label
              }}
            </template>
          </q-select>
          <q-card class="card-toggle" square flat>
            <q-toggle
              v-model="autoOpenPublishActionsSetting"
              name="auto-open-publish-actions-setting"
              class="w-full"
              label="Auto Open Actions Pan"
            >
            </q-toggle>
            <q-icon name="fa-solid fa-info-circle" class="mx-3">
              <q-tooltip>
                Automatically open the actions pan in the publish tab when an action is available
              </q-tooltip>
            </q-icon>
          </q-card>
        </div>
      </div>
    </div>

    <div class="color-details fixed right-2 bottom-2 flex gap-2 select-none">
      <div class="cursor-pointer" @click="showChangeLogsModal = true">
        <q-icon name="fa-solid fa-bug" class="mr-1" />
        Change Logs
      </div>
      |
      <div class="cursor-pointer" @click="showVersionModal = true">
        <q-icon name="fa-solid fa-info-circle" class="mr-1" />
        Version {{ appStore.appVersion }}
      </div>
    </div>
    <licenses-modal v-model:opened="showVersionModal" />
    <change-logs-modal v-model:opened="showChangeLogsModal" />
  </div>
</template>

<style scoped lang="less">
.settings {
  padding: 1rem;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.settings-group .settings-group-title {
  font-size: 1.125rem;
  line-height: 1.75rem;
  font-weight: 700;
}

.settings-group .settings-group-separator {
  height: 1px;
  border-width: 0px;
  background-color: #404040;
}

.settings-group .settings-group-item-container {
  display: grid;
  gap: 1rem;
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media (min-width: 1536px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.card-toggle {
  display: flex;
  align-items: center;
  min-height: 56px;
  border-radius: 0.25em !important;
}

.body--light {
  .card-toggle {
    background-color: #f5f5f5;
  }
}

.body--dark {
  .card-toggle {
    background-color: #262626;
  }
}
</style>
