<script setup lang="ts">
import ChainActionCard from '@renderer/components/tab-actions/ChainActionCard.vue'
import { useChainActionsStore } from '@renderer/store/chain-actions'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useActionsStore } from '@renderer/store/actions'
import { useAppStore } from '@renderer/store/app-store'
import { computed } from 'vue'

const chainActionsStore = useChainActionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const actionsStore = useActionsStore()
const appStore = useAppStore()

const goToActions = () => {
  actionsStore.setSelectedConnection(mqttTopicsStore.selectedConnection)
  appStore.setCurrentTab('actions')
}

const chainActions = computed(() => {
  if (!mqttTopicsStore.selectedConnection) return []
  if (!chainActionsStore.chainActions[mqttTopicsStore.selectedConnection]) return []

  return Object.values(chainActionsStore.chainActions[mqttTopicsStore.selectedConnection]).flat()
})
</script>

<template>
  <q-card v-if="!mqttTopicsStore.selectedConnection" flat class="tw-flex tw-h-full tw-items-center">
    <h1 class="tw-w-full tw-text-center tw-text-2xl tw-font-bold">Please select a topic</h1>
  </q-card>
  <q-card
    v-else-if="chainActions.length === 0"
    flat
    class="tw-flex tw-h-full tw-flex-col tw-justify-center"
  >
    <h1 class="tw-w-full tw-text-center tw-text-2xl tw-font-bold">No chain actions found</h1>
    <div class="text-center">
      <q-btn class="tw-mt-4" color="primary" label="Create new chain action" @click="goToActions" />
    </div>
  </q-card>
  <q-card v-else flat class="tw-grid tw-gap-2 tw-p-2">
    <chain-action-card
      v-for="chainAction in chainActions"
      class="tw-bg-neutral-800"
      :connection-id="mqttTopicsStore.selectedConnection"
      :chain-action="chainAction"
      :key="chainAction.id"
      no-context-menu
      no-grab
    />
  </q-card>
</template>

<style scoped lang="less"></style>
