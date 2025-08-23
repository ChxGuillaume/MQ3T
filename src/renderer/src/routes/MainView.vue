<script setup lang="ts">
import ImportChainActions from '@renderer/components/ImportChainActions.vue'
import ImportActionsGroups from '../components/ImportActionsGroups.vue'
import { useChainActionsStore } from '@renderer/store/chain-actions'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import ImportActions from '../components/ImportActions.vue'
import { useMqttTopicsStore } from '../store/mqtt-topics'
import { useDataGraphsStore } from '../store/data-graphs'
import { useSettingsStore } from '../store/settings-store'
import UpdateAlerts from '../components/UpdateAlerts.vue'
import { ElectronApi } from '../assets/js/electron-api'
import TabConnections from '../tabs/TabConnections.vue'
import { useActionsStore } from '../store/actions'
import TabSettings from '../tabs/TabSettings.vue'
import { useAppStore } from '../store/app-store'
import TabActions from '../tabs/TabActions.vue'
import TabTopics from '../tabs/TabTopics.vue'
import AppBar from '../components/AppBar.vue'
import { useQuasar } from 'quasar'

const mqttConnectionsStore = useMqttConnectionsStore()
const chainActionsStore = useChainActionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()
const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()
const appStore = useAppStore()

const currentTab = computed({
  get: () => appStore.currentTab,
  set: (val) => {
    appStore.setCurrentTab(val)
  }
})

const $q = useQuasar()

const handleKeyUp = (event: KeyboardEvent) => {
  if (event.ctrlKey) {
    switch (event.key) {
      case '1':
        currentTab.value = 'topics'
        break
      case '2':
        currentTab.value = 'actions'
        break
      case '4':
        currentTab.value = 'settings'
        break
      case '5':
        currentTab.value = 'connections'
        break
    }
  }
}

watch(
  () => $q.dark.isActive,
  (value) => {
    const classDark = 'dark'

    if (value) document.documentElement.classList.add(classDark)
    else document.documentElement.classList.remove(classDark)
  }
)

onMounted(() => {
  const storedTheme = localStorage.getItem('darkMode')

  switch (storedTheme) {
    case 'true':
      $q.dark.set(true)
      break
    case 'false':
      $q.dark.set(false)
      break
    default:
      $q.dark.set('auto')
      break
  }

  ElectronApi.initRenderer()

  ElectronApi.appVersion((_, value) => {
    appStore.setAppVersion(value)
  })

  ElectronApi.debug((_, value, ...args) => {
    console.warn(value, args)
  })

  ElectronApi.handleMqttError((event, value) => {
    console.error(event, value)

    const connection = mqttConnectionsStore.getConnection(value.clientKey)

    if (!connection) return

    $q.notify({
      message: `[${connection.name}]`,
      caption: value.error.message,
      type: 'negative'
    })
  })

  ElectronApi.handleMqttStatus((_, value) => {
    mqttConnectionsStore.setConnectionStatus(value.clientKey, value.status)
  })

  ElectronApi.handleMqttMessage((_, { clientKey, topic, message, packet }) => {
    mqttTopicsStore.addMessage(clientKey, topic, message, packet)
  })

  ElectronApi.handleLoadMqttConnections((_, connections) => {
    mqttConnectionsStore.setConnections(connections)
  })

  ElectronApi.handleLoadActions((_, actions) => {
    actionsStore.setActions(actions)
  })

  ElectronApi.handleLoadChainActions((_, chainActions) => {
    chainActionsStore.setChainActions(chainActions)
  })

  ElectronApi.handleLoadActionsGroups((_, actionGroups) => {
    actionsStore.setActionsGroups(actionGroups)
  })

  dataGraphsStore.initStore()
  settingsStore.initStore()

  window.addEventListener('keyup', handleKeyUp)
})

// TODO: This is kept as a counter mesure due to the refactoring of the application,
//  this should be removed in the future
watch(
  () => mqttTopicsStore.selectedConnection,
  (clientKey) => {
    if (!clientKey) return

    actionsStore.selectedConnection = clientKey
  }
)

onUnmounted(() => {
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<template>
  <div class="main-view tw-grid tw-h-full tw-grid-rows-[auto_1fr]">
    <app-bar v-model="currentTab" />
    <div class="tw-flex tw-content-between tw-overflow-auto">
      <div class="tw-flex-grow">
        <q-tab-panels v-model="currentTab" class="tw-h-full tw-bg-transparent" vertical keep-alive>
          <q-tab-panel class="tw-p-0" name="topics">
            <tab-topics />
          </q-tab-panel>
          <q-tab-panel class="tw-p-0" name="actions">
            <tab-actions />
          </q-tab-panel>
          <q-tab-panel class="tw-p-0" name="settings">
            <tab-settings />
          </q-tab-panel>
          <q-tab-panel class="tw-p-0" name="connections">
            <tab-connections />
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>
  </div>
  <update-alerts />
  <import-actions />
  <import-chain-actions />
  <import-actions-groups />
</template>

<style lang="less">
@import '../assets/css/styles.less';

.nav-bar-left {
  @apply tw-border-r;
  min-width: 135px;
  width: 135px;
}

.body--light {
  .nav-bar-left {
    @apply tw-border-black/10 tw-bg-zinc-100;
  }
}

.body--dark {
  .nav-bar-left {
    @apply tw-border-white/10 tw-bg-neutral-900;
  }
}
</style>
