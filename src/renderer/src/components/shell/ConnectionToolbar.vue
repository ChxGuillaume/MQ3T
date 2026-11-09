<script setup lang="ts">
import {
  hostLabel,
  protocolVersionLabel,
  statusDotClass
} from '@renderer/composables/useConnectionStatus'
import SegmentedControl, { SegmentedItem } from '@renderer/components/ui/SegmentedControl.vue'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useAppNavigation } from '@renderer/composables/useAppNavigation'
import { ConnectionSection, useAppStore } from '@renderer/store/app-store'
import { computed } from 'vue'

defineSlots<{ default?: () => unknown }>()

const emit = defineEmits<{ 'new-message': [] }>()

const mqttConnectionsStore = useMqttConnectionsStore()
const appStore = useAppStore()

const { selectedClientKey, currentSection } = useAppNavigation()

const connection = computed(() => mqttConnectionsStore.getConnection(selectedClientKey.value))

const isTemporary = computed(() => !!connection.value?.temporary)

const sections = computed<SegmentedItem<ConnectionSection>[]>(() => [
  { label: 'Explore', value: 'explore' },
  { label: 'Actions', value: 'actions', disabled: isTemporary.value },
  { label: 'Graphs', value: 'graphs' },
  { label: 'Broker', value: 'broker' }
])

const status = computed(() => mqttConnectionsStore.getConnectionStatus(selectedClientKey.value))
</script>

<template>
  <div class="border-default flex flex-wrap items-center gap-2 border-b px-3 py-2">
    <SegmentedControl v-model="currentSection" :items="sections" />

    <slot />

    <UTooltip
      v-if="isTemporary"
      text="Not saved: discarded when MQ3T closes. Save it to use actions."
    >
      <UBadge
        label="Temporary"
        icon="i-lucide-timer"
        color="warning"
        variant="subtle"
        class="ml-auto"
      />
    </UTooltip>

    <UButton
      v-if="isTemporary"
      icon="i-lucide-save"
      label="Save connection"
      color="neutral"
      variant="outline"
      @click="appStore.openConnectionEditor(selectedClientKey)"
    />

    <span
      v-if="connection"
      class="text-muted flex items-center gap-1.5 text-xs"
      :class="{ 'ml-auto': !isTemporary }"
      :title="`${connection.protocol}://${hostLabel(connection)}`"
    >
      <span class="size-2 rounded-full" :class="statusDotClass(status)" />
      {{ hostLabel(connection) }} · {{ protocolVersionLabel(connection) }}
    </span>

    <UTooltip text="New message" :kbds="['meta', 'N']">
      <UButton
        icon="i-lucide-send"
        label="New message"
        class="font-semibold"
        :class="{ 'ml-auto': !connection }"
        @click="emit('new-message')"
      />
    </UTooltip>
  </div>
</template>
