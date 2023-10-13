<script setup lang="ts">
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
  { label: 'XML', value: 'xml' }
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
</script>

<template>
  <div class="settings">
    <div class="tw-mb-3 tw-flex tw-justify-between tw-items-center">
      <h1 class="tw-text-xl tw-font-bold">Settings</h1>
      <q-btn
        color="primary"
        :disable="appStore.workingOnUpdate"
        @click="ElectronApi.checkForUpdates"
      >
        <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-sync" />
        Check for Update
      </q-btn>
    </div>
    <div
      class="tw-grid md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 2xl:tw-grid-cols-5 tw-gap-4"
    >
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
      <q-card class="card-toggle" square flat>
        <q-toggle v-model="smartTopicGroupCloseSetting" class="tw-w-full" label="Smart Topic Group">
        </q-toggle>
        <q-icon name="fa-solid fa-info-circle" class="tw-mx-3">
          <q-tooltip>
            When enabled topic groups closes if they are selected and clicked again
          </q-tooltip>
        </q-icon>
      </q-card>
      <q-select v-model="darkMode" filled :options="darkModeOptions" label="Dark Mode" emit-value>
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
      <q-input
        v-model="maxMessagesSetting"
        filled
        label="Messages History per Topic"
        type="number"
      />
      <q-card class="card-toggle" square flat>
        <q-toggle
          v-model="messagesPaginationSetting"
          label="Messages Pagination"
          class="tw-w-full"
        />
      </q-card>
      <q-select
        v-model="defaultDataFormatSetting"
        filled
        class="tw-text-white"
        :options="defaultDataFormatOptions"
        label="Time Format"
        emit-value
      >
        <template v-slot:selected-item>
          {{ defaultDataFormatOptions.find((o) => o.value === defaultDataFormatSetting)?.label }}
        </template>
      </q-select>
    </div>

    <div class="tw-fixed tw-bottom-2 tw-right-2 color-details">
      Version {{ appStore.appVersion }}
    </div>
  </div>
</template>

<style scoped lang="less">
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
