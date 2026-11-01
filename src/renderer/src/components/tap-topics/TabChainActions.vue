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
  appStore.setSection(mqttTopicsStore.selectedConnection, 'actions')
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
  <q-card v-if="!mqttTopicsStore.selectedConnection" flat class="flex h-full items-center">
    <h1 class="w-full text-center text-2xl font-bold">Please select a topic</h1>
  </q-card>
  <q-card v-else-if="chainActions.length === 0" flat class="flex h-full flex-col justify-center">
    <h1 class="w-full text-center text-2xl font-bold">No chain actions found</h1>
    <div class="text-center">
      <q-btn class="mt-4" color="primary" label="Create new chain action" @click="goToActions" />
    </div>
  </q-card>
  <q-card v-else flat class="grid h-full p-0" style="grid-template-rows: auto auto 1fr">
    <q-card-section class="h-[40px] p-0">
      <q-input v-model="search" filled label="Search Chain Action..." dense square debounce="100" />
    </q-card-section>
    <q-separator />

    <q-card-section class="flex flex-col gap-2 overflow-auto p-2">
      <q-card v-if="!filteredChainActions.length" flat class="flex h-full items-center">
        <h1 class="w-full text-center text-2xl font-bold">No chain actions found</h1>
      </q-card>
      <chain-action-card
        v-for="chainAction in filteredChainActions"
        :key="chainAction.id"
        class="bg-neutral-800"
        :connection-id="mqttTopicsStore.selectedConnection"
        :chain-action="chainAction"
        no-context-menu
        no-grab
      />
    </q-card-section>
  </q-card>
</template>

<style scoped lang="less"></style>
