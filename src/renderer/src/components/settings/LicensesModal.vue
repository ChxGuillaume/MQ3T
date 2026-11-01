<script setup lang="ts">
import { ElectronApi } from '@renderer/assets/js/electron-api'
import licensesJson from '@renderer/assets/licenses.json'
import logo from '@renderer/assets/img/logo.png'
import { computed, ref } from 'vue'

type Licenses = Record<
  string,
  { publisher?: string; repository?: string; licenses: string; url?: string }
>

const open = defineModel<boolean>('open', { default: false })

const versions = window.electron.process.versions

const runtimes = [
  { name: 'Electron', version: versions.electron, url: 'https://www.electronjs.org/' },
  { name: 'Chromium', version: versions.chrome, url: 'https://www.chromium.org/' },
  { name: 'Node', version: versions.node, url: 'https://nodejs.org/' },
  { name: 'V8', version: versions.v8, url: 'https://v8.dev/' }
]

const libraries = Object.entries(licensesJson as Licenses)
  .filter(([key]) => !key.startsWith('mq3t'))
  .map(([key, details]) => ({
    key,
    name: key.split('@').slice(0, -1).join('@'),
    version: key.split('@').at(-1),
    ...details
  }))

const search = ref('')

const filteredLibraries = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return libraries

  return libraries.filter(
    (library) =>
      library.name.toLowerCase().includes(query) ||
      library.licenses.toLowerCase().includes(query) ||
      library.publisher?.toLowerCase().includes(query)
  )
})
</script>

<template>
  <UModal
    v-model:open="open"
    title="Licenses"
    :ui="{ content: 'max-w-2xl', body: 'flex max-h-[70vh] flex-col gap-4 overflow-hidden' }"
  >
    <template #body>
      <div class="flex flex-wrap items-center gap-4">
        <button
          type="button"
          class="hover:bg-muted flex items-center gap-3 rounded-md p-1.5 pr-3 transition-colors"
          @click="ElectronApi.openUrl('https://github.com/ChxGuillaume/MQ3T')"
        >
          <img :src="logo" alt="" class="size-10" />
          <span class="text-left">
            <b class="block text-sm font-semibold">MQ3T</b>
            <span class="text-muted block text-xs">GPL-3.0</span>
          </span>
        </button>

        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="runtime in runtimes"
            :key="runtime.name"
            type="button"
            class="bg-muted text-muted hover:text-default rounded-full px-2.5 py-0.5 text-xs"
            @click="ElectronApi.openUrl(runtime.url)"
          >
            {{ runtime.name }} <span class="font-mono">{{ runtime.version }}</span>
          </button>
        </div>
      </div>

      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search libraries"
        aria-label="Search libraries"
        class="w-full"
      />

      <ul class="border-default -mx-1 min-h-0 flex-1 overflow-y-auto rounded-lg border">
        <li
          v-for="library in filteredLibraries"
          :key="library.key"
          class="border-default flex items-center gap-3 border-t px-4 py-2.5 first:border-t-0"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="truncate text-sm font-semibold">{{ library.name }}</span>
              <span class="text-dimmed font-mono text-xs">{{ library.version }}</span>
            </div>
            <span v-if="library.publisher" class="text-muted block truncate text-xs">
              {{ library.publisher }}
            </span>
          </div>
          <span class="bg-muted text-muted rounded-full px-2.5 py-0.5 text-xs">
            {{ library.licenses }}
          </span>
          <UTooltip v-if="library.url" text="Website">
            <UButton
              icon="i-lucide-link"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Website"
              @click="ElectronApi.openUrl(library.url)"
            />
          </UTooltip>
          <UTooltip v-if="library.repository" text="Repository">
            <UButton
              icon="i-lucide-github"
              color="neutral"
              variant="ghost"
              size="xs"
              aria-label="Repository"
              @click="ElectronApi.openUrl(library.repository)"
            />
          </UTooltip>
        </li>
        <li v-if="!filteredLibraries.length" class="text-muted px-4 py-6 text-center text-sm">
          No library matches "{{ search }}".
        </li>
      </ul>
    </template>
  </UModal>
</template>
