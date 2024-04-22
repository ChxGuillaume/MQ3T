<script setup lang="ts">
import { useAppStore } from '../store/app-store'
import { computed, ref, watch } from 'vue'
import axios from 'axios'

const appStore = useAppStore()

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

const releasesLoading = ref(true)
const releases = ref<any>([])

const fetchReleases = async () => {
  const { data } = await axios.get('https://api.github.com/repos/ChxGuillaume/MQ3T/releases')

  releasesLoading.value = false
  releases.value = data
}

watch(
  () => props.opened,
  (opened) => {
    if (opened) {
      releasesLoading.value = true
      fetchReleases()
    }
  }
)
</script>

<template>
  <q-dialog v-model="dialogOpened">
    <q-card flat class="dialog-card">
      <div
        v-if="releasesLoading"
        class="tw-w-full tw-h-full tw-flex tw-justify-center tw-items-center"
      >
        <q-spinner size="md" color="secondary" />
      </div>
      <q-card-section v-else>
        <h1 class="tw-text-3xl">Change Logs</h1>
        <div class="tw-mt-6 tw-flex tw-flex-col tw-gap-4">
          <div v-for="release in releases" :key="release.id">
            <h1
              class="release-title"
              :class="{
                current: release.name === appStore.appVersion
              }"
            >
              {{ release.name }}
              {{ release.name === appStore.appVersion ? '(Current version)' : '' }}
            </h1>
            <p class="tw-whitespace-pre-line">{{ release.body }}</p>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="less">
.dialog-card {
  width: 100%;
  min-width: 700px;

  min-height: 300px;
  height: 100%;
}

.release-title {
  @apply tw-text-2xl tw-text-neutral-500;
}

.release-title.current {
  @apply tw-text-secondary;
}
</style>
