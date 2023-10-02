<script setup lang="ts">
import { useSettingsStore } from '../store/settings-store'
import { useQuasar } from 'quasar'
import { computed, ref } from 'vue'
import moment from 'moment'

const $q = useQuasar()
const settingsStore = useSettingsStore()
const dateReference = ref(moment())

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
</script>

<template>
  <div class="settings">
    <div class="tw-mb-3 tw-flex tw-justify-between tw-items-center">
      <h1 class="tw-text-xl tw-font-bold">Settings</h1>
    </div>
    <div
      class="tw-grid md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 2xl:tw-grid-cols-5 tw-gap-4"
    >
      <q-card class="card-toggle" square flat>
        <q-toggle v-model="showActivitySetting" label="Show Activity" class="tw-w-full" />
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
