<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import ConnectionStatusBadge from './ConnectionStatusBadge.vue'
import { useAppStore } from '@renderer/store/app-store'
import { AppPlatform } from '@renderer/assets/js/electron-api'

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const appStore = useAppStore()
const isHomeHovered = ref(false)

const connectedConnections = computed(() => {
  return mqttConnectionsStore.getConnectionsWithStatus
})

interface MenuItemType {
  id: string
  label: string
  icon: string
  disabled?: boolean
  tabName: string
}

const menuItems = ref<MenuItemType[]>([
  { id: '1', label: 'Topics', icon: 'fa-solid fa-code', tabName: 'topics' },
  { id: '2', label: 'Actions', icon: 'fa-solid fa-play', tabName: 'actions' },
  {
    id: '3',
    label: 'Automations',
    icon: 'fa-solid fa-wand-sparkles',
    disabled: true,
    tabName: 'automations'
  },
  { id: '4', label: 'Settings', icon: 'fa-solid fa-sliders', tabName: 'settings' },
  { id: '5', label: 'Connections', icon: 'fa-solid fa-link', tabName: 'connections' }
])

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
        'tw-bg-black/10 dark:tw-bg-white/10': currentTab !== 'topics'
      }"
      @click.left="currentTab = 'connections'"
    >
      <q-menu v-model="menuOpened" context-menu>
        <q-list dense>
          <q-item
            v-for="item in menuItems"
            :key="item.id"
            v-close-popup="!item.disabled"
            :clickable="!item.disabled"
            :disable="item.disabled"
            class="tw-flex tw-items-center tw-gap-4"
            @click="!item.disabled && (currentTab = item.tabName)"
          >
            <q-icon :name="item.icon" size="xs" />
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
      <q-icon
        :name="isHomeHovered ? 'mdi-v7 mdi-home' : 'mdi-v7 mdi-home-outline'"
        size="xs"
        class="home-icon"
        :class="{
          other: appStore.currentTab !== 'topics' || menuOpened,
          topics: appStore.currentTab === 'topics'
        }"
      />
    </div>
    <div
      class="tw-ml-0 tw-grid tw-h-full tw-auto-cols-[minmax(100px,_150px)] tw-grid-flow-col tw-grid-rows-1"
    >
      <div
        v-for="connection in connectedConnections"
        :key="connection.clientKey"
        class="tw-flex tw-cursor-pointer tw-select-none tw-items-center tw-justify-between tw-gap-2 tw-px-3 hover:tw-text-black hover:dark:tw-text-white"
        :class="{
          'tw-text-neutral-400 dark:tw-text-neutral-400':
            connection.clientKey !== mqttTopicsStore.selectedConnection,
          'tw-bg-black/10 tw-text-black dark:tw-bg-white/10 dark:tw-text-white':
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
        >
          {{ connection.name }}
        </p>
        <connection-status-badge
          :status="mqttConnectionsStore.getConnectionStatus(connection.clientKey)"
          size="xs"
        />
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
    grid-template-columns: 4rem 40px minmax(min-content, max-content) 3rem;
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
  @apply tw-ml-0 tw-flex tw-h-full tw-cursor-pointer tw-items-center tw-px-3 hover:tw-bg-black/10 hover:dark:tw-bg-white/10;

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
</style>
