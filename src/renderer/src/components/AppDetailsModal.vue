<script setup lang="ts">
import { ElectronApi } from '../assets/js/electron-api'
import Versions from './Versions.vue'
import { computed, ref } from 'vue'

import licensesJson from '../assets/licenses.json'

interface Licenses {
  [library: string]: {
    publisher?: string
    repository: string
    licenses: string
    url?: string
  }
}

const licenses: Licenses = licensesJson as any

const props = defineProps<{
  opened: boolean
}>()

const emit = defineEmits<{
  'update:opened': [boolean]
}>()

const dialogOpened = computed({
  get: () => props.opened,
  set: (val) => {
    emit('update:opened', val)
  }
})

const licensesScrolled = ref(false)

const handleLicensesScroll = (e: Event) => {
  const offset = (e.target as HTMLElement).scrollTop
  licensesScrolled.value = offset > 0
}

const parseLibraryName = (library: string) => library.split('@').slice(0, -1).join('@')
</script>

<template>
  <q-dialog v-model="dialogOpened">
    <q-card flat class="tw-w-[700px]">
      <q-card-section class="top-section" :class="{ scrolled: licensesScrolled }">
        <versions />
      </q-card-section>

      <q-card-section
        class="tw-p-0 tw-max-h-[400px] tw-overflow-auto"
        @scroll="handleLicensesScroll"
      >
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
              <div class="tw-flex tw-flex-row tw-justify-end tw-items-start">
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
