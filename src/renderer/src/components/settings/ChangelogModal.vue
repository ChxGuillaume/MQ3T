<script setup lang="ts">
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { useAppStore } from '@renderer/store/app-store'
import { ref, watch } from 'vue'
import axios from 'axios'

type Release = { id: number; name: string; body: string; html_url: string; published_at: string }

const appStore = useAppStore()

const open = defineModel<boolean>('open', { default: false })

const loading = ref(false)
const failed = ref(false)
const releases = ref<Release[]>([])

const fetchReleases = async () => {
  loading.value = true
  failed.value = false

  try {
    const { data } = await axios.get<Release[]>(
      'https://api.github.com/repos/ChxGuillaume/MQ3T/releases'
    )
    releases.value = data
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

watch(open, (opened) => {
  if (opened) fetchReleases()
})
</script>

<template>
  <UModal
    v-model:open="open"
    title="Changelog"
    description="Release notes from GitHub."
    :ui="{ content: 'max-w-2xl', body: 'max-h-[70vh] overflow-y-auto' }"
  >
    <template #body>
      <div v-if="loading" class="flex justify-center py-10">
        <UIcon name="i-lucide-loader-circle" class="text-muted size-6 animate-spin" />
      </div>

      <div v-else-if="failed" class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-muted text-sm">Couldn't load the changelog.</p>
        <UButton color="neutral" variant="outline" label="Try again" @click="fetchReleases" />
      </div>

      <div v-else class="flex flex-col gap-6">
        <article v-for="release in releases" :key="release.id" class="flex flex-col gap-2">
          <header class="flex items-center gap-2">
            <h3
              class="text-base font-bold"
              :class="release.name === appStore.appVersion ? 'text-primary' : 'text-default'"
            >
              {{ release.name }}
            </h3>
            <UBadge
              v-if="release.name === appStore.appVersion"
              label="Current"
              variant="soft"
              size="sm"
            />
            <UButton
              icon="i-lucide-external-link"
              color="neutral"
              variant="ghost"
              size="xs"
              class="ml-auto"
              aria-label="Open on GitHub"
              @click="ElectronApi.openUrl(release.html_url)"
            />
          </header>
          <p class="text-muted text-[13px] leading-relaxed whitespace-pre-line">
            {{ release.body }}
          </p>
        </article>
      </div>
    </template>
  </UModal>
</template>
