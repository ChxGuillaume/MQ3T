<script setup lang="ts">
import { statusDotClass, statusLabel } from '@renderer/composables/useConnectionStatus'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useAppNavigation } from '@renderer/composables/useAppNavigation'
import { useConnectionMenu } from '@renderer/composables/useConnectionMenu'
import { AppPlatform } from '@renderer/assets/js/electron-api'
import { useAppStore } from '@renderer/store/app-store'
import { computed } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const appStore = useAppStore()

const { selectedClientKey, openConnection, openNewTab, toggleSettings, closeConnection } =
  useAppNavigation()
const { connectionMenuItems } = useConnectionMenu()

const openConnections = computed(() => mqttConnectionsStore.getConnectionsWithStatus)

const isActive = (clientKey: string) =>
  appStore.view === 'connection' && selectedClientKey.value === clientKey

const isMac = AppPlatform === 'darwin'
</script>

<template>
  <header
    class="border-default bg-chrome flex h-[46px] shrink-0 items-center gap-1 border-b [-webkit-app-region:drag]"
    :class="isMac ? 'pl-[92px]' : 'pl-3'"
  >
    <nav
      aria-label="Open connections"
      class="flex min-w-0 [scrollbar-width:none] items-center gap-1 overflow-x-auto [-webkit-app-region:no-drag]"
    >
      <UContextMenu
        v-for="connection in openConnections"
        :key="connection.clientKey"
        :items="connectionMenuItems(connection, closeConnection)"
      >
        <div
          role="tab"
          tabindex="0"
          :aria-selected="isActive(connection.clientKey)"
          class="group flex h-[30px] max-w-60 min-w-[170px] cursor-pointer items-center gap-2 rounded-full border pr-1 pl-3 text-[13px] transition-colors select-none"
          :class="
            isActive(connection.clientKey)
              ? 'border-default bg-default text-default font-semibold shadow-xs'
              : 'text-muted hover:text-default hover:bg-elevated/60 border-transparent font-medium'
          "
          @click="openConnection(connection.clientKey)"
          @keydown.enter="openConnection(connection.clientKey)"
          @auxclick.middle="closeConnection(connection.clientKey)"
        >
          <span
            class="size-2 shrink-0 rounded-full"
            :class="statusDotClass(mqttConnectionsStore.getConnectionStatus(connection.clientKey))"
            :title="statusLabel(mqttConnectionsStore.getConnectionStatus(connection.clientKey))"
          />
          <span class="flex-1 truncate" :title="connection.name">{{ connection.name }}</span>
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="neutral"
            variant="ghost"
            aria-label="Close tab"
            class="text-muted rounded-full"
            @click.stop="closeConnection(connection.clientKey)"
          />
        </div>
      </UContextMenu>

      <div
        v-if="appStore.view === 'new-tab' && openConnections.length"
        role="tab"
        aria-selected="true"
        class="border-default bg-default flex h-[30px] min-w-[170px] items-center rounded-full border pl-3 text-[13px] font-semibold shadow-xs select-none"
      >
        New tab
      </div>
    </nav>

    <UTooltip text="New tab" :kbds="['meta', 'T']">
      <UButton
        icon="i-lucide-plus"
        color="neutral"
        variant="ghost"
        aria-label="New tab"
        class="text-muted rounded-full [-webkit-app-region:no-drag]"
        @click="openNewTab"
      />
    </UTooltip>

    <div class="flex-1" />

    <UTooltip text="Settings" :kbds="['meta', ',']">
      <UButton
        icon="i-lucide-sliders-horizontal"
        color="neutral"
        variant="ghost"
        aria-label="Settings"
        :aria-pressed="appStore.view === 'settings'"
        class="mr-2 shrink-0 [-webkit-app-region:no-drag]"
        :class="appStore.view === 'settings' ? 'bg-primary/10 text-primary' : 'text-muted'"
        @click="toggleSettings"
      />
    </UTooltip>

    <div v-if="!isMac" class="w-[138px] shrink-0 self-stretch" />
  </header>
</template>
