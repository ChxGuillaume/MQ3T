<script setup lang="ts">
import ChainActionCard from '@renderer/components/tab-actions/ChainActionCard.vue'
import { useChainActionsStore } from '@renderer/store/chain-actions'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useActionsStore } from '@renderer/store/actions'
import { useAppStore } from '@renderer/store/app-store'
import { computed, ref } from 'vue'

const chainActionsStore = useChainActionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const actionsStore = useActionsStore()
const appStore = useAppStore()

const search = ref('')

const goToActions = () => {
  actionsStore.setSelectedConnection(mqttTopicsStore.selectedConnection)
  appStore.setCurrentTab('actions')
}

const chainActions = computed(() => {
  if (!mqttTopicsStore.selectedConnection) return []
  if (!chainActionsStore.chainActions[mqttTopicsStore.selectedConnection]) return []

  return Object.values(chainActionsStore.chainActions[mqttTopicsStore.selectedConnection]).flat()
})

const transformForSearch = (value: string) => {
  return value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

const filteredChainActions = computed(() => {
  const transformedSearch = transformForSearch(search.value)

  return chainActions.value.filter((chainAction) =>
    transformForSearch(chainAction.name).includes(transformedSearch)
  )
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
  <q-card v-else flat class="tw-grid tw-h-full tw-p-0" style="grid-template-rows: auto auto 1fr">
    <q-card-section class="tw-h-[40px] tw-p-0">
      <q-input v-model="search" filled label="Search Chain Action..." dense square debounce="100" />
    </q-card-section>
    <q-separator />

    <q-card-section class="tw-flex tw-flex-col tw-gap-2 tw-overflow-auto tw-p-2">
      <q-card v-if="!filteredChainActions.length" flat class="tw-flex tw-h-full tw-items-center">
        <h1 class="tw-w-full tw-text-center tw-text-2xl tw-font-bold">No chain actions found</h1>
      </q-card>
      <chain-action-card
        v-for="chainAction in filteredChainActions"
        class="tw-bg-neutral-800"
        :connection-id="mqttTopicsStore.selectedConnection"
        :chain-action="chainAction"
        :key="chainAction.id"
        no-context-menu
        no-grab
      />
    </q-card-section>
  </q-card>
</template>

<style scoped lang="less"></style>
