<script setup lang="ts">
import { useAppColorMode, type AppColorMode } from '@renderer/composables/useAppColorMode'
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import ChangelogModal from '@renderer/components/settings/ChangelogModal.vue'
import LicensesModal from '@renderer/components/settings/LicensesModal.vue'
import SettingsRow from '@renderer/components/settings/SettingsRow.vue'
import { useAppUpdate } from '@renderer/composables/useAppUpdate'
import { useSettingsStore } from '@renderer/store/settings-store'
import { HasAutoUpdate } from '@renderer/assets/js/electron-api'
import { useAppStore } from '@renderer/store/app-store'
import { computed, onMounted, ref } from 'vue'
import moment from 'moment'

const settingsStore = useSettingsStore()
const appStore = useAppStore()

const { mode } = useAppColorMode()
const update = useAppUpdate()

const sections = [
  { id: 'app', label: 'App' },
  { id: 'explore', label: 'Explore' },
  { id: 'actions', label: 'Actions' },
  { id: 'about', label: 'About' }
] as const

type SectionId = (typeof sections)[number]['id']

const scroller = ref<HTMLElement | null>(null)
const activeSection = ref<SectionId>('app')

const sectionElement = (id: SectionId) =>
  scroller.value?.querySelector<HTMLElement>(`[data-section="${id}"]`)

const updateActiveSection = () => {
  const container = scroller.value
  if (!container) return

  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 4) {
    activeSection.value = sections[sections.length - 1].id
    return
  }

  const top = container.getBoundingClientRect().top
  let current: SectionId = sections[0].id
  for (const section of sections) {
    const element = sectionElement(section.id)
    if (element && element.getBoundingClientRect().top - top <= 48) current = section.id
  }
  activeSection.value = current
}

const scrollToSection = (id: SectionId) => {
  sectionElement(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(updateActiveSection)

const themeItems: { label: string; value: AppColorMode }[] = [
  { label: 'System', value: 'auto' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' }
]

const theme = computed<AppColorMode>({
  get: () => (mode.value as AppColorMode) ?? 'auto',
  set: (value) => {
    mode.value = value
  }
})

const now = moment()

const dateFormatItems = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD'].map((format) => ({
  label: `${now.format(format)} (${format})`,
  value: format
}))

const timeFormatItems = ['HH:mm:ss', 'hh:mm:ss A'].map((format) => ({
  label: `${now.format(format)} (${format})`,
  value: format
}))

const activityStyleItems = [
  { label: 'Laser', value: 'laser' },
  { label: 'Topic heat', value: 'topic-heat' }
] as const

const activitySpeeds = [
  { label: 'Slower', value: 3000 },
  { label: 'Slow', value: 2000 },
  { label: 'Normal', value: 1000 },
  { label: 'Fast', value: 500 },
  { label: 'Faster', value: 250 }
]

const activitySpeedIndex = computed({
  get: () => {
    const index = activitySpeeds.findIndex(
      (s) => s.value === settingsStore.showActivityAnimationSpeed
    )
    return index === -1 ? 2 : index
  },
  set: (index: number) => settingsStore.setShowActivityAnimationSpeed(activitySpeeds[index].value)
})

const payloadFormatItems = [
  { label: 'Raw', value: 'raw' },
  { label: 'JSON', value: 'json' },
  { label: 'XML', value: 'xml' },
  { label: 'YAML', value: 'yaml' }
] as const

const maxMessages = computed({
  get: () => settingsStore.maxMessages,
  set: (value: number | string) => {
    const parsed = Number(value)
    if (Number.isInteger(parsed) && parsed > 0) settingsStore.setMaxMessages(parsed)
  }
})

const showActivity = computed({
  get: () => settingsStore.showActivity,
  set: (value: boolean) => settingsStore.setShowActivity(value)
})

const activityStyle = computed({
  get: () => settingsStore.showActivityAnimationType,
  set: (value) => settingsStore.setShowActivityAnimationType(value)
})

const dateFormat = computed({
  get: () => settingsStore.dateFormat,
  set: (value: string) => settingsStore.setDateFormat(value)
})

const timeFormat = computed({
  get: () => settingsStore.timeFormat,
  set: (value: string) => settingsStore.setTimeFormat(value)
})

const smartTopicGroupClose = computed({
  get: () => settingsStore.smartTopicGroupClose,
  set: (value: boolean) => settingsStore.setSmartTopicGroupClose(value)
})

const messagesPagination = computed({
  get: () => settingsStore.messagesPagination,
  set: (value: boolean) => settingsStore.setMessagesPagination(value)
})

const selectedMessageCompare = computed({
  get: () => settingsStore.selectedMessageCompare,
  set: (value: boolean) => settingsStore.setSelectedMessageCompare(value)
})

const defaultDataFormat = computed({
  get: () => settingsStore.defaultDataFormat,
  set: (value) => settingsStore.setDefaultDataFormat(value)
})

const autoOpenPublishActions = computed({
  get: () => settingsStore.autoOpenPublishActions,
  set: (value: boolean) => settingsStore.setAutoOpenPublishActions(value)
})

const chainActionsTrackpadMode = computed({
  get: () => settingsStore.chainActionsTrackpadMode,
  set: (value: boolean) => settingsStore.setChainActionsTrackpadMode(value)
})

const participateToReleaseCandidates = computed({
  get: () => settingsStore.participateToReleaseCandidates,
  set: (value: boolean) => settingsStore.setParticipateToReleaseCandidates(value)
})

const updateStatusLabel = computed(() => {
  if (!HasAutoUpdate) return "Automatic updates aren't available for this build."

  const version = update.info.value?.version
  switch (update.status.value) {
    case 'checking':
      return 'Checking for updates…'
    case 'up-to-date':
      return "You're up to date."
    case 'available':
      return `Version ${version} is available.`
    case 'downloading':
      return `Downloading ${version}… ${Math.floor(update.percent.value)}%`
    case 'ready':
      return `Version ${version} is ready to install.`
    case 'error':
      return `Update failed: ${update.errorMessage.value}`
    default:
      return ''
  }
})

const hasPendingUpdate = computed(() =>
  ['available', 'downloading', 'ready'].includes(update.status.value)
)

const changelogOpen = ref(false)
const licensesOpen = ref(false)
</script>

<template>
  <div ref="scroller" class="bg-default overflow-y-auto" @scroll.passive="updateActiveSection">
    <div class="mx-auto flex w-full max-w-[1080px] flex-wrap gap-6 px-6 py-8">
      <nav
        aria-label="Settings sections"
        class="sticky top-8 flex max-w-[200px] flex-[1_1_180px] flex-col gap-0.5 self-start text-[13px]"
      >
        <h1 class="mb-3 ml-3 text-[22px] font-bold">Settings</h1>
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          class="flex h-9 items-center rounded-md px-3 text-left"
          :class="
            activeSection === section.id
              ? 'bg-primary/10 text-primary font-bold'
              : 'text-default hover:bg-muted'
          "
          :aria-current="activeSection === section.id ? 'true' : undefined"
          @click="scrollToSection(section.id)"
        >
          {{ section.label }}
        </button>
      </nav>

      <div class="min-w-0 flex-[999_1_560px] space-y-7">
        <section data-section="app" class="scroll-mt-8 space-y-2.5">
          <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">App</h2>
          <div class="border-default overflow-hidden rounded-lg border">
            <SettingsRow title="Theme" description="System follows your OS setting.">
              <SegmentedControl v-model="theme" :items="themeItems" />
            </SettingsRow>
            <SettingsRow title="Date format">
              <USelect
                v-model="dateFormat"
                :items="dateFormatItems"
                aria-label="Date format"
                class="min-w-[220px]"
              />
            </SettingsRow>
            <SettingsRow title="Time format">
              <USelect
                v-model="timeFormat"
                :items="timeFormatItems"
                aria-label="Time format"
                class="min-w-[220px]"
              />
            </SettingsRow>
          </div>
        </section>

        <section data-section="explore" class="scroll-mt-8 space-y-2.5">
          <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">Explore</h2>
          <div class="border-default overflow-hidden rounded-lg border">
            <SettingsRow title="Show activity" description="Highlight topics as messages arrive.">
              <USwitch v-model="showActivity" aria-label="Show activity" />
            </SettingsRow>
            <SettingsRow title="Activity style">
              <USelect
                v-model="activityStyle"
                :items="[...activityStyleItems]"
                :disabled="!showActivity"
                aria-label="Activity style"
                class="min-w-[180px]"
              />
            </SettingsRow>
            <SettingsRow title="Activity speed">
              <div class="flex w-[240px] items-center gap-3">
                <USlider
                  v-model="activitySpeedIndex"
                  :min="0"
                  :max="activitySpeeds.length - 1"
                  :step="1"
                  :disabled="!showActivity"
                  aria-label="Activity speed"
                  class="flex-1"
                />
                <span class="text-muted w-14 text-right text-[13px]">
                  {{ activitySpeeds[activitySpeedIndex].label }}
                </span>
              </div>
            </SettingsRow>
            <SettingsRow
              title="Smart topic grouping"
              description="Clicking a selected topic group collapses it."
            >
              <USwitch v-model="smartTopicGroupClose" aria-label="Smart topic grouping" />
            </SettingsRow>
            <SettingsRow
              title="Default payload format"
              description="Used by the publish editor and new actions."
            >
              <SegmentedControl v-model="defaultDataFormat" :items="[...payloadFormatItems]" />
            </SettingsRow>
            <SettingsRow
              title="Messages kept per topic"
              description="Older messages are dropped from History."
            >
              <UInput
                v-model="maxMessages"
                type="number"
                :min="1"
                aria-label="Messages kept per topic"
                class="w-[100px]"
              />
            </SettingsRow>
            <SettingsRow
              title="Paginate history"
              description="Split the History list into pages instead of one long list."
            >
              <USwitch v-model="messagesPagination" aria-label="Paginate history" />
            </SettingsRow>
            <SettingsRow
              title="Compare with latest message"
              description="Show the selected message as a diff against the latest one."
            >
              <USwitch v-model="selectedMessageCompare" aria-label="Compare with latest message" />
            </SettingsRow>
          </div>
        </section>

        <section data-section="actions" class="scroll-mt-8 space-y-2.5">
          <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">Actions</h2>
          <div class="border-default overflow-hidden rounded-lg border">
            <SettingsRow
              title="Open the actions panel automatically"
              description="When a topic has saved actions, switch the publish panel to them."
            >
              <USwitch
                v-model="autoOpenPublishActions"
                aria-label="Open the actions panel automatically"
              />
            </SettingsRow>
            <SettingsRow
              title="Trackpad mode in chain editor"
              description="Scroll to pan the canvas, hold Shift while scrolling to zoom."
            >
              <USwitch
                v-model="chainActionsTrackpadMode"
                aria-label="Trackpad mode in chain editor"
              />
            </SettingsRow>
          </div>
        </section>

        <section data-section="about" class="scroll-mt-8 space-y-2.5">
          <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">About</h2>
          <div class="border-default overflow-hidden rounded-lg border">
            <SettingsRow :title="`MQ3T ${appStore.appVersion}`" :description="updateStatusLabel">
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-if="hasPendingUpdate"
                  label="View update"
                  @click="update.dialogOpen.value = true"
                />
                <UButton
                  v-else-if="HasAutoUpdate"
                  color="neutral"
                  variant="outline"
                  label="Check for updates"
                  :loading="update.status.value === 'checking'"
                  :disabled="appStore.workingOnUpdate"
                  @click="update.checkForUpdates"
                />
                <UButton
                  color="neutral"
                  variant="outline"
                  label="Changelog"
                  @click="changelogOpen = true"
                />
                <UButton
                  color="neutral"
                  variant="outline"
                  label="Licenses"
                  @click="licensesOpen = true"
                />
              </div>
            </SettingsRow>
            <SettingsRow
              v-if="HasAutoUpdate"
              title="Release candidates"
              description="Get pre-release versions before the stable release. They may contain minor issues."
            >
              <USwitch v-model="participateToReleaseCandidates" aria-label="Release candidates" />
            </SettingsRow>
          </div>
        </section>
      </div>
    </div>

    <ChangelogModal v-model:open="changelogOpen" />
    <LicensesModal v-model:open="licensesOpen" />
  </div>
</template>
