<script setup lang="ts">
import ConnectionContextMenu from '@renderer/components/tap-topics/ConnectionContextMenu.vue'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import ConnectionStatusBadge from './ConnectionStatusBadge.vue'
import { AppPlatform } from '@renderer/assets/js/electron-api'
import { useAppStore } from '@renderer/store/app-store'
import { computed, ref } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const appStore = useAppStore()

const connectedConnections = computed(() => {
  return mqttConnectionsStore.getConnectionsWithStatus
})

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const currentTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const menuOpened = ref(false)

const handleCloseConnection = (clientKey: string) => {
  mqttConnectionsStore.disconnectClient(clientKey)

  mqttTopicsStore.selectedConnection = ''
  mqttTopicsStore.selectedTopic = ''

  setTimeout(() => {
    appStore.setCurrentTab('connections')
    mqttConnectionsStore.hideConnection(clientKey)
  }, 1)
}

const goToConnectionsTab = () => {
  mqttTopicsStore.selectedConnection = ''
  currentTab.value = 'connections'
}

const isTopicsTab = computed(() => {
  return ['topics', 'actions'].includes(currentTab.value) && !menuOpened.value
})
</script>

<template>
  <q-bar
    class="app-bar tw-grid tw-h-10 tw-gap-0 tw-overflow-hidden tw-bg-white tw-px-0 dark:tw-bg-[#121212]"
    :class="[AppPlatform]"
  >
    <div class="grabbable" />
    <div
      class="home-btn"
      :class="{
        'tw-bg-neutral-200 dark:tw-bg-neutral-800': !isTopicsTab
      }"
      @click.left="goToConnectionsTab"
    >
      <q-icon
        :name="!isTopicsTab ? 'mdi-v7 mdi-home' : 'mdi-v7 mdi-home-outline'"
        size="20px"
        class="home-icon"
        :class="{ other: !isTopicsTab, topics: isTopicsTab }"
      />
    </div>
    <div
      class="tw-ml-0 tw-grid tw-h-full tw-auto-cols-[minmax(36px,_150px)] tw-grid-flow-col tw-grid-rows-1"
    >
      <div
        v-for="connection in connectedConnections"
        :key="connection.clientKey"
        class="connection-tab"
        :class="{
          'tw-text-neutral-400 dark:tw-text-neutral-400':
            connection.clientKey !== mqttTopicsStore.selectedConnection,
          'tw-bg-neutral-200 tw-text-black dark:tw-bg-neutral-800 dark:tw-text-white':
            connection.clientKey === mqttTopicsStore.selectedConnection
        }"
        @click="
          () => {
            mqttTopicsStore.selectedConnection = connection.clientKey
            mqttTopicsStore.selectedTopic = ''
            appStore.setCurrentTab('topics')
          }
        "
      >
        <p
          class="text-weight-medium tw-line-clamp-1 tw-overflow-hidden tw-text-ellipsis tw-break-all tw-text-xs"
          :title="connection.name"
          v-text="connection.name"
        />
        <connection-status-badge
          class="connection-tab-status-badge"
          :status="mqttConnectionsStore.getConnectionStatus(connection.clientKey)"
          size="xs"
        />

        <q-icon
          class="connection-tab-close-icon"
          name="fa-solid fa-close"
          @click.prevent.stop="handleCloseConnection(connection.clientKey)"
        />

        <connection-context-menu :connection="connection" />
      </div>
    </div>
    <div class="grabbable" />
  </q-bar>
</template>

<style lang="less" scoped>
.grabbable {
  @apply tw-h-full;

  -webkit-app-region: drag;
}

.app-bar {
  &.darwin {
    grid-template-columns: 5rem 40px minmax(min-content, max-content) minmax(3rem, auto);
  }

  &.linux {
    // TODO: Adjust for Linux if needed
    grid-template-columns: 0 40px minmax(min-content, max-content) minmax(180px, auto);
  }

  &.win32 {
    grid-template-columns: 0 40px minmax(min-content, max-content) minmax(180px, auto);
  }
}

.home-btn {
  @apply tw-ml-0 tw-flex tw-h-full tw-cursor-pointer tw-items-center tw-justify-center hover:tw-bg-black/10 hover:dark:tw-bg-white/10;

  & {
    .home-icon.topics {
      @apply tw-text-neutral-400 dark:tw-text-neutral-400;
    }

    .home-icon.other {
      @apply tw-text-black dark:tw-text-white;
    }
  }

  &:hover {
    .home-icon {
      @apply tw-text-black dark:tw-text-white;
    }
  }
}

.connection-tab {
  @apply tw-relative tw-flex tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-gap-2 tw-px-3 hover:tw-text-black hover:dark:tw-text-white;

  .connection-tab-close-icon {
    @apply tw-absolute tw-right-2 tw-cursor-pointer tw-opacity-0;

    padding: 2px;

    &:hover {
      @apply tw-rounded tw-bg-neutral-700;
    }
  }

  &:hover {
    .connection-tab-close-icon {
      @apply tw-opacity-100;
    }

    .connection-tab-status-badge {
      @apply tw-opacity-0;
    }
  }
}
</style>
