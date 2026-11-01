<script setup lang="ts">
import ConnectionContextMenu from '@renderer/components/tap-topics/ConnectionContextMenu.vue'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useLabelColors } from '@renderer/composables/useLabelColors'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import ConnectionStatusBadge from './ConnectionStatusBadge.vue'
import { AppPlatform } from '@renderer/assets/js/electron-api'
import { useAppStore } from '@renderer/store/app-store'
import { computed, ref } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const appStore = useAppStore()

const { getColor } = useLabelColors()

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

  mqttTopicsStore.clearSelectedTopic(clientKey)
  mqttTopicsStore.selectedConnection = ''

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
    class="app-bar grid h-10 gap-0 overflow-hidden bg-white px-0 dark:bg-[#121212]"
    :class="[AppPlatform]"
  >
    <div class="grabbable" />
    <div
      class="home-btn"
      :class="{
        'bg-neutral-200 dark:bg-neutral-800': !isTopicsTab
      }"
      @click.left="goToConnectionsTab"
    >
      <q-icon
        name="fa-solid fa-house"
        size="14px"
        class="home-icon"
        :class="{ other: !isTopicsTab, topics: isTopicsTab }"
      />
    </div>
    <div class="ml-0 grid h-full auto-cols-[minmax(36px,150px)] grid-flow-col grid-rows-1">
      <div
        v-for="connection in connectedConnections"
        :key="connection.clientKey"
        class="connection-tab mt-px border-t-2"
        :class="[
          {
            'text-neutral-400 dark:text-neutral-400':
              connection.clientKey !== mqttTopicsStore.selectedConnection,
            'bg-neutral-200 text-black dark:bg-neutral-800 dark:text-white':
              connection.clientKey === mqttTopicsStore.selectedConnection
          },
          getColor(connection.labelColor)?.border ?? 'border-transparent'
        ]"
        @click="
          () => {
            mqttTopicsStore.selectedConnection = connection.clientKey
            appStore.setCurrentTab('topics')
          }
        "
      >
        <p
          class="text-weight-medium line-clamp-1 overflow-hidden text-xs break-all text-ellipsis"
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
  height: 100%;

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
  margin-left: 0px;
  display: flex;
  height: 100%;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: rgb(0 0 0 / 0.1);
  }
  .body--dark &:hover {
    background-color: rgb(255 255 255 / 0.1);
  }

  & {
    .home-icon.topics {
      color: #a3a3a3;
      .body--dark & {
        color: #a3a3a3;
      }
    }

    .home-icon.other {
      color: black;
      .body--dark & {
        color: white;
      }
    }
  }

  &:hover {
    .home-icon {
      color: black;
      .body--dark & {
        color: white;
      }
    }
  }
}

.connection-tab {
  position: relative;
  display: flex;
  cursor: pointer;
  user-select: none;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  &:hover {
    color: black;
  }
  .body--dark &:hover {
    color: white;
  }

  .connection-tab-close-icon {
    position: absolute;
    right: 0.5rem;
    cursor: pointer;
    opacity: 0;

    padding: 2px;

    &:hover {
      border-radius: 0.25rem;
      background-color: #404040;
    }
  }

  &:hover {
    .connection-tab-close-icon {
      opacity: 1;
    }

    .connection-tab-status-badge {
      opacity: 0;
    }
  }
}
</style>
