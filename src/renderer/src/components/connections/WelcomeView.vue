<script setup lang="ts">
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { useAppStore } from '@renderer/store/app-store'

const appStore = useAppStore()

const importActions = () => {
  ElectronApi.importData([{ name: 'JSON', extensions: ['json'] }])
}
</script>

<template>
  <main class="flex items-center justify-center px-6 py-10">
    <div class="flex max-w-[520px] flex-col items-center gap-7 text-center">
      <div>
        <h1 class="text-[30px] font-bold">No connections yet</h1>
        <p class="text-muted mt-2.5 text-sm leading-normal">
          Add an MQTT broker to start exploring its topics. Each connection opens in its own tab.
        </p>
      </div>

      <div class="flex flex-wrap justify-center gap-2.5">
        <UButton
          icon="i-lucide-plus"
          label="New connection"
          size="lg"
          class="h-[42px] rounded-[10px] px-[22px] font-semibold"
          @click="appStore.openConnectionEditor(null)"
        />
        <UButton
          label="Import actions file"
          color="neutral"
          variant="outline"
          size="lg"
          class="h-[42px] rounded-[10px] px-[18px]"
          @click="importActions"
        />
      </div>

      <ol class="bg-muted flex w-full flex-col gap-3.5 rounded-[14px] p-5 text-left text-[13px]">
        <li class="flex items-start gap-3">
          <b
            class="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs"
            >1</b
          >
          <span>
            Enter the broker host and port, for example
            <span class="font-mono">localhost:1883</span>.
          </span>
        </li>
        <li class="flex items-start gap-3">
          <b
            class="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs"
            >2</b
          >
          <span>
            Subscribe to <span class="font-mono">#</span> to see everything, or narrow it to
            <span class="font-mono">sensors/#</span>.
          </span>
        </li>
        <li class="flex items-start gap-3">
          <b
            class="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs"
            >3</b
          >
          <span>Topics show up as a live tree. Click one to see its value, history and graph.</span>
        </li>
      </ol>
    </div>
  </main>
</template>
