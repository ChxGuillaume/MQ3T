<script setup lang="ts">
import { statusDotClass, statusLabel } from '@renderer/composables/useConnectionStatus'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useAppNavigation } from '@renderer/composables/useAppNavigation'
import { useConnectionMenu } from '@renderer/composables/useConnectionMenu'
import { AppPlatform } from '@renderer/assets/js/electron-api'
import { useAppStore } from '@renderer/store/app-store'
import { MqttConnection } from '../../../../types/mqtt-connection'
import { computed } from 'vue'
import draggable from 'vuedraggable'

const mqttConnectionsStore = useMqttConnectionsStore()
const appStore = useAppStore()

const { selectedClientKey, openConnection, openNewTab, toggleSettings, closeConnection } =
  useAppNavigation()
const { connectionMenuItems } = useConnectionMenu()

const openConnections = computed<MqttConnection[]>({
  get: () => mqttConnectionsStore.getConnectionsWithStatus,
  set: (connections) =>
    mqttConnectionsStore.setTabOrder(connections.map((connection) => connection.clientKey))
})

const activateDraggedTab = ({ oldIndex }: { oldIndex: number }) => {
  const connection = openConnections.value[oldIndex]

  if (connection) openConnection(connection.clientKey)
}

const isActive = (clientKey: string) =>
  appStore.view === 'connection' && selectedClientKey.value === clientKey

const isMac = AppPlatform === 'darwin'

const tabColorStyle = (labelColor?: string | null) =>
  labelColor ? { '--tab-color': `var(--color-${labelColor}-500)` } : undefined

const tabClass = (labelColor: string | null | undefined, active: boolean) => {
  if (!labelColor) {
    return active
      ? 'border-default bg-default text-default font-semibold shadow-xs'
      : 'text-muted hover:text-default hover:bg-elevated/60 border-transparent font-medium'
  }

  return active
    ? 'border-[color-mix(in_oklab,var(--tab-color)_45%,transparent)] bg-[color-mix(in_oklab,var(--tab-color)_12%,var(--ui-bg))] text-default font-semibold shadow-xs'
    : 'text-muted hover:text-default hover:bg-[color-mix(in_oklab,var(--tab-color)_10%,transparent)] border-transparent font-medium'
}
</script>

<template>
  <header
    class="border-default bg-chrome flex h-[46px] shrink-0 items-center gap-1 border-b [-webkit-app-region:drag]"
    :class="isMac ? 'pl-[92px]' : 'pl-3'"
  >
    <draggable
      v-model="openConnections"
      tag="nav"
      item-key="clientKey"
      direction="horizontal"
      :animation="150"
      force-fallback
      :fallback-tolerance="4"
      ghost-class="tab-drag-ghost"
      fallback-class="tab-drag-fallback"
      aria-label="Open connections"
      class="flex min-w-0 [scrollbar-width:none] items-center gap-1 overflow-x-auto [-webkit-app-region:no-drag]"
      @start="activateDraggedTab"
    >
      <template #item="{ element: connection }">
        <div class="rounded-lg">
          <UContextMenu :items="connectionMenuItems(connection, closeConnection)">
            <div
              role="tab"
              tabindex="0"
              :aria-selected="isActive(connection.clientKey)"
              class="group flex h-[34px] max-w-60 min-w-[170px] cursor-pointer items-center gap-2 rounded-lg border pr-1 pl-2 text-[13px] transition-colors select-none"
              :class="tabClass(connection.labelColor, isActive(connection.clientKey))"
              :style="tabColorStyle(connection.labelColor)"
              @click="openConnection(connection.clientKey)"
              @keydown.enter="openConnection(connection.clientKey)"
              @auxclick.middle="closeConnection(connection.clientKey)"
            >
              <span
                class="h-4 w-[3px] shrink-0 rounded-full"
                :class="
                  connection.labelColor
                    ? isActive(connection.clientKey)
                      ? 'bg-(--tab-color)'
                      : 'bg-(--tab-color) opacity-60'
                    : 'bg-transparent'
                "
                aria-hidden="true"
              />
              <span
                class="size-2 shrink-0 rounded-full"
                :class="
                  statusDotClass(mqttConnectionsStore.getConnectionStatus(connection.clientKey))
                "
                :title="statusLabel(mqttConnectionsStore.getConnectionStatus(connection.clientKey))"
              />
              <span class="flex-1 truncate" :title="connection.name">{{ connection.name }}</span>
              <UButton
                icon="i-lucide-x"
                size="xs"
                color="neutral"
                variant="ghost"
                aria-label="Close tab"
                class="text-muted rounded-md"
                @click.stop="closeConnection(connection.clientKey)"
              />
            </div>
          </UContextMenu>
        </div>
      </template>

      <template #footer>
        <div
          v-if="appStore.view === 'new-tab' && openConnections.length"
          role="tab"
          aria-selected="true"
          class="border-default bg-default flex h-[34px] min-w-[170px] items-center rounded-lg border pl-3 text-[13px] font-semibold shadow-xs select-none"
        >
          New tab
        </div>
      </template>
    </draggable>

    <UTooltip text="New tab" :kbds="['meta', 'T']">
      <UButton
        icon="i-lucide-plus"
        color="neutral"
        variant="ghost"
        aria-label="New tab"
        class="text-muted [-webkit-app-region:no-drag]"
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

<style scoped>
:deep(.tab-drag-ghost) {
  opacity: 0.35;
}

:global(.tab-drag-fallback) {
  opacity: 1 !important;
  cursor: grabbing;
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.2);
}
</style>
