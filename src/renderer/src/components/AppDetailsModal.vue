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
    <q-card flat class="grid w-full">
      <q-card-section class="top-section grid gap-2 pb-2" :class="{ scrolled: licensesScrolled }">
        <div class="flex">
          <div
            class="flex w-[156px] cursor-pointer flex-col items-center gap-2 p-2 transition-colors hover:bg-neutral-400/20"
            @click="ElectronApi.openUrl('https://github.com/ChxGuillaume/MQ3T')"
          >
            <q-img :src="logo" alt="Logo" class="w-[72px]" />
            <div class="flex items-center gap-1">
              <h1 class="text-xl">MQ3T</h1>
              <span class="color-details">-</span>
              <p class="text-secondary grow">GPL-3.0</p>
            </div>
          </div>

          <versions class="grow" />
        </div>

        <div class="flex justify-center">
          <q-btn
            v-if="HasAutoUpdate"
            color="primary"
            size="sm"
            :disable="appStore.workingOnUpdate"
            @click="ElectronApi.checkForUpdates"
          >
            <q-icon class="mr-2" size="12px" name="fa-solid fa-sync" />
            Check for Update

            <q-popup-proxy context-menu>
              <q-card class="flex items-center gap-2 pr-4">
                <q-toggle
                  v-model="participateToReleaseCandidates"
                  name="release-candidate"
                  label="Release Candidate"
                />

                <q-icon name="fa-solid fa-circle-info" size="12px">
                  <q-tooltip class="max-w-[280px]">
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

      <q-card-section class="max-h-[600px] overflow-auto p-0" @scroll="handleLicensesScroll">
        <q-expansion-item label="Used Libraries">
          <q-list>
            <q-item
              v-for="[libraryName, details] in Object.entries(licenses)"
              :key="libraryName"
              v-ripple
            >
              <q-item-section>
                <q-item-label class="flex gap-1">
                  <span>{{ parseLibraryName(libraryName) }}</span>
                  <span class="color-details">-</span>
                  <span class="text-secondary">{{ details.licenses }}</span>
                </q-item-label>
                <q-item-label v-if="details.publisher" class="color-details">
                  By {{ details.publisher }}
                </q-item-label>
              </q-item-section>
              <q-item-section avatar class="w-18">
                <div class="flex flex-row items-start justify-end">
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
  padding: 0px;
  transition-property: box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
  box-shadow: none;
}

.top-section.scrolled {
  box-shadow: 0 4px 20px -2px black;
}
</style>
