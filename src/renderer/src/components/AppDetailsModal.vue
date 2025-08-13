<script setup lang="ts">
import { ElectronApi, HasAutoUpdate } from '../assets/js/electron-api'
import { useSettingsStore } from '@renderer/store/settings-store'
import { useAppStore } from '@renderer/store/app-store'
import Versions from './Versions.vue'
import { computed, ref } from 'vue'

import licensesJson from '../assets/licenses.json'
import logo from '../assets/img/logo.png'

interface Licenses {
  [library: string]: {
    publisher?: string
    repository: string
    licenses: string
    url?: string
  }
}

const settingsStore = useSettingsStore()
const appStore = useAppStore()

const licenses = licensesJson as Licenses

delete licenses[Object.keys(licenses).find((key) => key.startsWith('mq3t')) || '']

const props = defineProps<{ opened: boolean }>()
const emit = defineEmits<{ 'update:opened': [boolean] }>()

const licensesScrolled = ref(false)

const participateToReleaseCandidates = computed({
  get: () => settingsStore.participateToReleaseCandidates,
  set: (val) => {
    settingsStore.setParticipateToReleaseCandidates(val)
  }
})

const dialogOpened = computed({
  get: () => props.opened,
  set: (val) => {
    emit('update:opened', val)
  }
})

const handleLicensesScroll = (e: Event) => {
  const offset = (e.target as HTMLElement).scrollTop
  licensesScrolled.value = offset > 0
}

const parseLibraryName = (library: string) => library.split('@').slice(0, -1).join('@')
</script>

<template>
  <q-dialog v-model="dialogOpened">
    <q-card flat class="tw-grid tw-w-full">
      <q-card-section
        class="top-section tw-grid tw-gap-2 tw-pb-2"
        :class="{ scrolled: licensesScrolled }"
      >
        <div class="tw-flex">
          <div
            class="tw-flex tw-w-[156px] tw-cursor-pointer tw-flex-col tw-items-center tw-gap-2 tw-p-2 tw-transition-colors hover:tw-bg-neutral-400/20"
            @click="ElectronApi.openUrl('https://github.com/ChxGuillaume/MQ3T')"
          >
            <q-img :src="logo" alt="Logo" class="tw-w-[72px]" />
            <div class="tw-flex tw-items-center tw-gap-1">
              <h1 class="tw-text-xl">MQ3T</h1>
              <span class="color-details">-</span>
              <p class="tw-flex-grow tw-text-secondary">GPL-3.0</p>
            </div>
          </div>

          <versions class="tw-flex-grow" />
        </div>

        <div class="tw-flex tw-justify-center">
          <q-btn
            v-if="HasAutoUpdate"
            color="primary"
            size="sm"
            :disable="appStore.workingOnUpdate"
            @click="ElectronApi.checkForUpdates"
          >
            <q-icon class="tw-mr-2" size="12px" name="fa-solid fa-sync" />
            Check for Update

            <q-popup-proxy context-menu>
              <q-card class="tw-flex tw-items-center tw-gap-2 tw-pr-4">
                <q-toggle
                  v-model="participateToReleaseCandidates"
                  name="release-candidate"
                  label="Release Candidate"
                />

                <q-icon name="fa-solid fa-circle-info" size="12px">
                  <q-tooltip class="tw-max-w-[280px]">
                    When enabled, you will receive update notifications for pre-release versions
                    (Release Candidates) before the final stable release. Recommended for early
                    testers; these builds may contain minor issues.
                  </q-tooltip>
                </q-icon>
              </q-card>
            </q-popup-proxy>
          </q-btn>
        </div>
      </q-card-section>

      <q-card-section
        class="tw-max-h-[600px] tw-overflow-auto tw-p-0"
        @scroll="handleLicensesScroll"
      >
        <q-expansion-item label="Used Libraries">
          <q-list>
            <q-item
              v-for="[libraryName, details] in Object.entries(licenses)"
              :key="libraryName"
              v-ripple
            >
              <q-item-section>
                <q-item-label class="tw-flex tw-gap-1">
                  <span>{{ parseLibraryName(libraryName) }}</span>
                  <span class="color-details">-</span>
                  <span class="tw-text-secondary">{{ details.licenses }}</span>
                </q-item-label>
                <q-item-label v-if="details.publisher" class="color-details">
                  By {{ details.publisher }}
                </q-item-label>
              </q-item-section>
              <q-item-section avatar class="tw-w-18">
                <div class="tw-flex tw-flex-row tw-items-start tw-justify-end">
                  <q-btn
                    v-if="details.url"
                    color="secondary"
                    size="sm"
                    round
                    flat
                    @click.stop="ElectronApi.openUrl(details.url)"
                  >
                    <q-icon name="fa-solid fa-link" />
                  </q-btn>
                  <q-btn
                    color="secondary"
                    size="sm"
                    round
                    flat
                    @click.stop="ElectronApi.openUrl(details.repository)"
                  >
                    <q-icon color="secondary" name="fa-brands fa-github" />
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="less">
.top-section {
  @apply tw-p-0 tw-transition-shadow;
  box-shadow: none;
}

.top-section.scrolled {
  box-shadow: 0 4px 20px -2px black;
}
</style>
