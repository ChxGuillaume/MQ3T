<script setup lang="ts">
import {
  formatMegabytes,
  releaseNotesItems,
  useAppUpdate
} from '@renderer/composables/useAppUpdate'
import ChangelogModal from '@renderer/components/settings/ChangelogModal.vue'
import { useAppStore } from '@renderer/store/app-store'
import { computed, onMounted, ref } from 'vue'

const appStore = useAppStore()

const {
  status,
  info,
  progress,
  percent,
  remainingSeconds,
  downloadSize,
  dialogOpen,
  download,
  install,
  listen
} = useAppUpdate()

const changelogOpen = ref(false)

const notes = computed(() => releaseNotesItems(info.value?.releaseNotes).slice(0, 6))

const step = computed(() => {
  if (status.value === 'ready') return 'ready'
  if (status.value === 'downloading') return 'downloading'
  return 'available'
})

const remainingLabel = computed(() => {
  const seconds = remainingSeconds.value
  if (seconds === null) return ''
  if (seconds < 60) return `about ${seconds} s left`
  return `about ${Math.ceil(seconds / 60)} min left`
})

onMounted(listen)
</script>

<template>
  <UModal
    v-model:open="dialogOpen"
    :ui="{ content: 'max-w-[520px] rounded-2xl', footer: 'justify-end gap-2' }"
  >
    <template #header>
      <div class="flex flex-col gap-1">
        <span class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
          <template v-if="step === 'available'">Update available</template>
          <template v-else-if="step === 'downloading'">Downloading</template>
          <template v-else>Ready to install</template>
        </span>

        <template v-if="step === 'available'">
          <h2 class="text-highlighted text-lg font-bold">MQ3T {{ info?.version }} is available</h2>
          <p class="text-muted text-[13px]">
            You have {{ appStore.appVersion
            }}<template v-if="downloadSize"> · {{ downloadSize }} download</template>
          </p>
        </template>

        <h2 v-else-if="step === 'downloading'" class="text-highlighted text-lg font-bold">
          Downloading {{ info?.version }}
        </h2>

        <template v-else>
          <h2 class="text-highlighted text-lg font-bold">Restart to finish updating</h2>
          <p class="text-muted text-[13px]">
            MQ3T closes and reopens on the new version. Message history is not kept.
          </p>
        </template>
      </div>
    </template>

    <template v-if="step !== 'ready'" #body>
      <div v-if="step === 'available'" class="flex flex-col gap-2">
        <template v-if="notes.length">
          <span class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
            What's new
          </span>
          <ul class="flex list-disc flex-col gap-1.5 pl-[18px] text-[13px] leading-[1.45]">
            <li v-for="(note, index) in notes" :key="index">{{ note }}</li>
          </ul>
        </template>
        <UButton
          label="Full changelog"
          variant="link"
          class="self-start p-0 text-[13px] font-semibold"
          @click="changelogOpen = true"
        />
      </div>

      <div v-else class="flex flex-col gap-2">
        <UProgress
          :model-value="progress ? percent : null"
          size="md"
          aria-label="Download progress"
        />
        <div class="text-muted flex justify-between text-xs">
          <span v-if="progress">
            {{ formatMegabytes(progress.transferred) }} of {{ formatMegabytes(progress.total) }}
          </span>
          <span v-else>Starting download…</span>
          <span>{{ remainingLabel }}</span>
        </div>
      </div>
    </template>

    <template #footer>
      <template v-if="step === 'available'">
        <UButton color="neutral" variant="outline" label="Later" @click="dialogOpen = false" />
        <UButton label="Download" @click="download" />
      </template>

      <template v-else-if="step === 'downloading'">
        <span class="text-muted mr-auto text-xs">You can keep working.</span>
        <UButton color="neutral" variant="outline" label="Hide" @click="dialogOpen = false" />
      </template>

      <template v-else>
        <UButton
          color="neutral"
          variant="outline"
          label="On next launch"
          @click="dialogOpen = false"
        />
        <UButton label="Restart now" @click="install" />
      </template>
    </template>
  </UModal>

  <ChangelogModal v-model:open="changelogOpen" />
</template>
