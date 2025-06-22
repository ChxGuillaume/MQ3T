<script setup lang="ts">
import ChangeLogsModal from '../components/ChangeLogsModal.vue'
import LicensesModal from '../components/AppDetailsModal.vue'
import { useSettingsStore } from '../store/settings-store'
import { ElectronApi } from '../assets/js/electron-api'
import { useAppStore } from '../store/app-store'
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import moment from 'moment'

const $q = useQuasar()
const settingsStore = useSettingsStore()
const dateReference = ref(moment())
const appStore = useAppStore()

const darkMode = computed({
  get: () => $q.dark.mode,
  set: (val) => {
    $q.dark.set(val)
    localStorage.setItem('darkMode', `${val}`)
  }
})

const darkModeOptions = [
  { label: 'System', value: 'auto' },
  { label: 'On', value: true },
  { label: 'Off', value: false }
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

const companionServerEnabledSetting = computed({
  get: () => settingsStore.companionServerEnabled,
  set: (val) => settingsStore.setCompanionServerEnabled(val)
})

const showChangeLogsModal = ref(false)
const showVersionModal = ref(false)

// @ts-ignore (define in dts)
const hasAutoUpdate = window.hasAutoUpdate
</script>

<template>
  <div class="settings">
    <div class="tw-mb-6 tw-flex tw-items-center tw-justify-between">
      <h1 class="tw-text-xl tw-font-bold">Settings</h1>
      <q-btn
        v-if="hasAutoUpdate"
        color="primary"
        :disable="appStore.workingOnUpdate"
        @click="ElectronApi.checkForUpdates"
      >
        <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-sync" />
        Check for Update
      </q-btn>
    </div>
    <div class="tw-flex tw-flex-col tw-gap-6">
      <div class="settings-group">
        <h2 class="settings-group-title">App</h2>
        <hr class="settings-group-separator" />
        <div class="settings-group-item-container">
          <q-select
            v-model="darkMode"
            filled
            :options="darkModeOptions"
            label="Dark Mode"
            emit-value
          >
            <template v-slot:selected-item>
              {{ darkModeOptions.find((o) => o.value === darkMode)?.label }}
            </template>
          </q-select>
          <q-select
            v-model="dateFormatSetting"
            filled
            class="tw-text-white"
            :options="dateFormatOptions"
            label="Date Format"
            emit-value
          >
            <template v-slot:selected-item>
              {{ dateFormatOptions.find((o) => o.value === dateFormatSetting)?.label }}
            </template>
          </q-select>
          <q-select
            v-model="timeFormatSetting"
            filled
            class="tw-text-white"
            :options="timeFormatOptions"
            label="Time Format"
            emit-value
          >
            <template v-slot:selected-item>
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
            <q-toggle v-model="showActivitySetting" label="Show Activity" class="tw-w-full" />
          </q-card>
          <q-select
            v-model="showActivityAnimationSpeedSetting"
            filled
            :options="showActivityAnimationSpeedOptions"
            label="Activity Animation Speed"
            emit-value
          >
            <template v-slot:selected-item>
              {{
                showActivityAnimationSpeedOptions.find(
                  (o) => o.value === showActivityAnimationSpeedSetting
                )?.label
              }}
            </template>
          </q-select>
          <q-select
            v-model="showActivityAnimationTypeSetting"
            filled
            :options="showActivityAnimationTypeOptions"
            label="Activity Animation Style"
            emit-value
          >
            <template v-slot:selected-item>
              {{
                showActivityAnimationTypeOptions.find(
                  (o) => o.value === showActivityAnimationTypeSetting
                )?.label
              }}
            </template>
          </q-select>
          <q-input
            v-model="maxMessagesSetting"
            filled
            label="Messages History per Topic"
            type="number"
          />
          <q-card class="card-toggle" square flat>
            <q-toggle
              v-model="smartTopicGroupCloseSetting"
              class="tw-w-full"
              label="Smart Topic Group"
            />
            <q-icon name="fa-solid fa-info-circle" class="tw-mx-3">
              <q-tooltip>
                When enabled topic groups closes if they are selected and clicked again
              </q-tooltip>
            </q-icon>
          </q-card>
          <q-card class="card-toggle" square flat>
            <q-toggle
              v-model="messagesPaginationSetting"
              label="Messages Pagination"
              class="tw-w-full"
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
            filled
            class="tw-text-white"
            :options="defaultDataFormatOptions"
            label="Default Data Format"
            emit-value
          >
            <template v-slot:selected-item>
              {{
                defaultDataFormatOptions.find((o) => o.value === defaultDataFormatSetting)?.label
              }}
            </template>
          </q-select>
          <q-card class="card-toggle" square flat>
            <q-toggle
              v-model="autoOpenPublishActionsSetting"
              class="tw-w-full"
              label="Auto Open Actions Pan"
            >
            </q-toggle>
            <q-icon name="fa-solid fa-info-circle" class="tw-mx-3">
              <q-tooltip>
                Automatically open the actions pan in the publish tab when an action is available
              </q-tooltip>
            </q-icon>
          </q-card>
        </div>
      </div>
      <div class="settings-group">
        <h2 class="settings-group-title">Companion App</h2>
        <hr class="settings-group-separator" />
        <div class="settings-group-item-container">
          <q-card class="card-toggle" square flat>
            <q-toggle
              v-model="companionServerEnabledSetting"
              class="tw-w-full"
              label="Enable Server"
            >
            </q-toggle>
            <q-icon name="fa-solid fa-info-circle" class="tw-mx-3">
              <q-tooltip>
                Enabling this will make your MQ3T session visible on your network so you can use the
                Companion App. <br /><br />
                Note: on your first interaction you'll have to authenticate with a 4 digit code that
                will be shown on your desktop app <br />
                so that you and only you can interact with your MQTT connections/actions
              </q-tooltip>
            </q-icon>
          </q-card>
        </div>
      </div>
    </div>

    <div class="color-details tw-fixed tw-bottom-2 tw-right-2 tw-flex tw-select-none tw-gap-2">
      <div class="tw-cursor-pointer" @click="showChangeLogsModal = true">
        <q-icon name="fa-solid fa-bug" class="tw-mr-1" />
        Change Logs
      </div>
      |
      <div class="tw-cursor-pointer" @click="showVersionModal = true">
        <q-icon name="fa-solid fa-info-circle" class="tw-mr-1" />
        Version {{ appStore.appVersion }}
      </div>
    </div>
    <licenses-modal v-model:opened="showVersionModal" />
    <change-logs-modal v-model:opened="showChangeLogsModal" />
  </div>
</template>

<style scoped lang="less">
.settings-group {
  @apply tw-flex tw-flex-col tw-gap-2;
}

.settings-group .settings-group-title {
  @apply tw-text-lg tw-font-bold;
}

.settings-group .settings-group-separator {
  @apply tw-h-px tw-border-0 tw-bg-neutral-700;
}

.settings-group .settings-group-item-container {
  @apply tw-grid tw-gap-4 md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 2xl:tw-grid-cols-5;
}

.card-toggle {
  @apply tw-flex tw-items-center;
  min-height: 56px;
  border-radius: 0.25em !important;
}

.body--light {
  .card-toggle {
    @apply tw-bg-neutral-100;
  }
}

.body--dark {
  .card-toggle {
    @apply tw-bg-neutral-800;
  }
}
</style>
