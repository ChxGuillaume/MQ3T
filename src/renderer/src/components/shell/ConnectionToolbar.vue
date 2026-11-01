<script setup lang="ts">
import {
  hostLabel,
  protocolVersionLabel,
  statusDotClass
} from '@renderer/composables/useConnectionStatus'
import SegmentedControl, { SegmentedItem } from '@renderer/components/ui/SegmentedControl.vue'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useAppNavigation } from '@renderer/composables/useAppNavigation'
import { ConnectionSection } from '@renderer/store/app-store'
import { computed } from 'vue'

defineSlots<{ default?: () => unknown }>()

const emit = defineEmits<{ 'new-message': [] }>()

const mqttConnectionsStore = useMqttConnectionsStore()

const { selectedClientKey, currentSection } = useAppNavigation()

const sections: SegmentedItem<ConnectionSection>[] = [
  { label: 'Explore', value: 'explore' },
  { label: 'Actions', value: 'actions' },
  { label: 'Graphs', value: 'graphs' },
  { label: 'Broker', value: 'broker' }
]

const connection = computed(() => mqttConnectionsStore.getConnection(selectedClientKey.value))

const status = computed(() => mqttConnectionsStore.getConnectionStatus(selectedClientKey.value))
</script>

<template>
  <div class="border-default flex flex-wrap items-center gap-2 border-b px-3 py-2">
    <SegmentedControl v-model="currentSection" :items="sections" />

    <slot />

    <span
      v-if="connection"
      class="text-muted ml-auto flex items-center gap-1.5 text-xs"
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
