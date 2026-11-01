<script setup lang="ts">
import {
  Action,
  ActionGroup,
  ChainAction,
  ExportActionsFile,
  ExportChainActionsFile,
  ExportGroupsFile
} from '../../../../../types/actions'
import { validateChainAction } from '@renderer/assets/js/validate-chain-action'
import { validateActionGroup } from '@renderer/assets/js/validate-action-group'
import { useAppNavigation } from '@renderer/composables/useAppNavigation'
import { useChainActionsStore } from '@renderer/store/chain-actions'
import { validateAction } from '@renderer/assets/js/validate-action'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { useActionsStore } from '@renderer/store/actions'
import ConnectionSelect from '../../ConnectionSelect.vue'
import { useToast } from '@nuxt/ui/composables'
import { DEFAULT_GROUP } from '../action-utils'
import { computed, ref, watch } from 'vue'

const KEEP_GROUPS = '__keep-groups'

type ImportItem = { key: string; name: string; kind: 'action' | 'chain' }
type ImportGroup = { key: string; group?: ActionGroup; name: string; items: ImportItem[] }

const chainActionsStore = useChainActionsStore()
const actionsStore = useActionsStore()
const toast = useToast()

const { selectedClientKey } = useAppNavigation()

const opened = ref(false)
const fileType = ref<'groups' | 'actions' | 'chain-actions'>('actions')
const groups = ref<ExportGroupsFile['groups']>([])
const actions = ref<Record<string, Action[]>>({})
const chainActions = ref<Record<string, ChainAction[]>>({})

const connectionId = ref('')
const targetGroupId = ref('default')
const selected = ref<Set<string>>(new Set())

const LOOSE_KEY = '__file'

const notifyWrongFile = (what: string, value: unknown) => {
  console.warn(`Invalid ${what}`, value)
  toast.add({ title: 'Wrong file format', color: 'error', icon: 'i-lucide-circle-alert' })
}

const allValid = <T,>(list: T[], validate: (value: T) => boolean, what: string) => {
  for (const item of list) {
    if (!validate(item)) {
      notifyWrongFile(what, item)
      return false
    }
  }

  return true
}

const actionKey = (groupKey: string, index: number) => `a:${groupKey}:${index}`
const chainKey = (groupKey: string, index: number) => `c:${groupKey}:${index}`

const tree = computed<ImportGroup[]>(() => {
  const groupKeys = fileType.value === 'groups' ? groups.value.map((g) => g.id) : [LOOSE_KEY]

  return groupKeys.map((key) => {
    const group = groups.value.find((g) => g.id === key)

    return {
      key,
      group,
      name: group?.name ?? (fileType.value === 'chain-actions' ? 'Chains' : 'Actions'),
      items: [
        ...(actions.value[key] ?? []).map((a, i) => ({
          key: actionKey(key, i),
          name: a.name,
          kind: 'action' as const
        })),
        ...(chainActions.value[key] ?? []).map((c, i) => ({
          key: chainKey(key, i),
          name: c.name,
          kind: 'chain' as const
        }))
      ]
    }
  })
})

const allKeys = computed(() =>
  tree.value.flatMap((g) => (g.items.length ? g.items.map((i) => i.key) : [`g:${g.key}`]))
)

const existingNames = computed(() => {
  const actionNames = new Set(
    actionsStore.getConnectionActions(connectionId.value).map((a) => `${a.name}\u0000${a.topic}`)
  )
  const chainNames = new Set(
    Object.values(chainActionsStore.getConnectionChainActions(connectionId.value))
      .flat()
      .map((c) => c.name)
  )

  return { actionNames, chainNames }
})

const itemExists = (groupKey: string, item: ImportItem) => {
  const index = Number(item.key.split(':').pop())

  if (item.kind === 'action') {
    const action = actions.value[groupKey]?.[index]
    return !!action && existingNames.value.actionNames.has(`${action.name}\u0000${action.topic}`)
  }

  return existingNames.value.chainNames.has(item.name)
}

const resetSelection = () => {
  const next = new Set<string>()

  for (const group of tree.value) {
    if (!group.items.length) next.add(`g:${group.key}`)

    for (const item of group.items) {
      if (!itemExists(group.key, item)) next.add(item.key)
    }
  }

  selected.value = next
}

watch(connectionId, () => {
  if (!groupItems.value.some((item) => item.value === targetGroupId.value)) {
    targetGroupId.value = fileType.value === 'groups' ? KEEP_GROUPS : 'default'
  }

  if (opened.value) resetSelection()
})

const groupState = (group: ImportGroup): boolean | 'indeterminate' => {
  if (!group.items.length) return selected.value.has(`g:${group.key}`)

  const count = group.items.filter((i) => selected.value.has(i.key)).length

  if (count === 0) return false
  if (count === group.items.length) return true
  return 'indeterminate'
}

const ariaChecked = (group: ImportGroup) => {
  const state = groupState(group)

  return state === 'indeterminate' ? 'mixed' : state
}

const toggle = (key: string) => {
  const next = new Set(selected.value)

  if (next.has(key)) next.delete(key)
  else next.add(key)

  selected.value = next
}

const toggleGroup = (group: ImportGroup) => {
  const keys = group.items.length ? group.items.map((i) => i.key) : [`g:${group.key}`]
  const select = groupState(group) !== true
  const next = new Set(selected.value)

  for (const key of keys) {
    if (select) next.add(key)
    else next.delete(key)
  }

  selected.value = next
}

const groupNote = (group: ImportGroup) => {
  const actionCount = group.items.filter((i) => i.kind === 'action').length
  const chainCount = group.items.length - actionCount
  const parts = [
    actionCount ? `${actionCount} action${actionCount > 1 ? 's' : ''}` : '',
    chainCount ? `${chainCount} chain${chainCount > 1 ? 's' : ''}` : ''
  ].filter(Boolean)

  return [group.group ? 'group' : '', parts.join(', ') || 'empty'].filter(Boolean).join(' · ')
}

const fileSummary = computed(() => {
  const actionCount = Object.values(actions.value).flat().length
  const chainCount = Object.values(chainActions.value).flat().length

  return [
    fileType.value === 'groups'
      ? `${groups.value.length} group${groups.value.length > 1 ? 's' : ''}`
      : '',
    `${actionCount} action${actionCount === 1 ? '' : 's'}`,
    chainCount ? `${chainCount} chain${chainCount > 1 ? 's' : ''}` : ''
  ]
    .filter(Boolean)
    .join(' · ')
})

const fileLabel = computed(() => {
  switch (fileType.value) {
    case 'groups':
      return 'Groups export'
    case 'chain-actions':
      return 'Chains export'
    default:
      return 'Actions export'
  }
})

const groupItems = computed(() => [
  ...(fileType.value === 'groups'
    ? [{ label: 'Keep groups from the file', value: KEEP_GROUPS }]
    : []),
  ...[DEFAULT_GROUP, ...actionsStore.getConnectionGroups(connectionId.value)].map((g) => ({
    label: g.name,
    value: g.id
  }))
])

const open = () => {
  connectionId.value = selectedClientKey.value || connectionId.value
  targetGroupId.value =
    fileType.value === 'groups'
      ? KEEP_GROUPS
      : actionsStore.getConnectionGroup(connectionId.value, actionsStore.selectedActionGroup)
        ? actionsStore.selectedActionGroup
        : 'default'

  opened.value = true
  resetSelection()
}

ElectronApi.handleImportData((_, rawData) => {
  let data: ExportGroupsFile | ExportActionsFile | ExportChainActionsFile

  try {
    data = JSON.parse(rawData)
  } catch (_error) {
    notifyWrongFile('file', rawData.slice(0, 200))
    return
  }

  if (!data?.version) return

  if (data.type === 'groups') {
    if (!data.actions) return

    const chainList = Object.values(data.chainActions ?? {}).flat()
    const actionList = Object.values(data.actions).flat()

    if (!allValid(chainList, validateChainAction, 'chain action')) return
    if (!allValid(actionList, validateAction, 'action')) return
    if (!allValid(data.groups, validateActionGroup, 'group')) return

    fileType.value = 'groups'
    groups.value = data.groups
    actions.value = data.actions
    chainActions.value = data.chainActions ?? {}
  } else if (data.type === 'actions') {
    if (!data.actions) return
    if (!allValid(data.actions, validateAction, 'action')) return

    fileType.value = 'actions'
    groups.value = []
    actions.value = { [LOOSE_KEY]: data.actions }
    chainActions.value = {}
  } else if (data.type === 'chain-actions') {
    if (!data.chainActions) return
    if (!allValid(data.chainActions, validateChainAction, 'chain action')) return

    fileType.value = 'chain-actions'
    groups.value = []
    actions.value = {}
    chainActions.value = { [LOOSE_KEY]: data.chainActions }
  } else {
    return
  }

  open()
})

const handleChooseFile = () => {
  ElectronApi.importData([{ name: 'JSON', extensions: ['json'] }])
}

const close = () => {
  opened.value = false
}

const handleImport = () => {
  if (!connectionId.value) return

  let importedActions = 0
  let importedChains = 0

  for (const group of tree.value) {
    const pickedActions = (actions.value[group.key] ?? []).filter((_, i) =>
      selected.value.has(actionKey(group.key, i))
    )
    const pickedChains = (chainActions.value[group.key] ?? []).filter((_, i) =>
      selected.value.has(chainKey(group.key, i))
    )
    const groupPicked = selected.value.has(`g:${group.key}`)

    if (!pickedActions.length && !pickedChains.length && !groupPicked) continue

    let groupId = targetGroupId.value

    if (targetGroupId.value === KEEP_GROUPS && group.group) {
      groupId = actionsStore.addActionGroupToConnection(group.group, connectionId.value).id
    } else if (targetGroupId.value === KEEP_GROUPS) {
      groupId = 'default'
    }

    for (const action of pickedActions) {
      actionsStore.addActionToConnectionGroup(action, connectionId.value, groupId)
    }

    for (const chainAction of pickedChains) {
      chainActionsStore.addChainAction(connectionId.value, groupId, chainAction)
    }

    importedActions += pickedActions.length
    importedChains += pickedChains.length
  }

  toast.add({
    title: 'Imported successfully',
    description: [
      `${importedActions} action${importedActions === 1 ? '' : 's'}`,
      importedChains ? `${importedChains} chain${importedChains > 1 ? 's' : ''}` : ''
    ]
      .filter(Boolean)
      .join(' · '),
    color: 'success',
    icon: 'i-lucide-check'
  })

  close()
}
</script>

<template>
  <UModal
    :open="opened"
    title="Import actions"
    :ui="{ content: 'sm:max-w-[620px]', body: 'flex flex-col gap-4', footer: 'justify-end' }"
    @update:open="!$event && close()"
  >
    <template #body>
      <div
        class="border-default flex items-center gap-3 rounded-xl border-[1.5px] border-dashed px-3.5 py-3"
      >
        <span
          aria-hidden="true"
          class="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold"
        >
          {}
        </span>
        <div class="min-w-0 flex-1">
          <div class="font-semibold">{{ fileLabel }}</div>
          <div class="text-muted text-xs">{{ fileSummary }}</div>
        </div>
        <UButton
          color="neutral"
          variant="outline"
          label="Choose another file"
          @click="handleChooseFile"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
          Pick what to import
        </span>
        <div class="border-default max-h-[360px] overflow-auto rounded-xl border">
          <template v-for="(group, groupIndex) in tree" :key="group.key">
            <div
              role="checkbox"
              :aria-checked="ariaChecked(group)"
              tabindex="0"
              class="bg-muted border-default flex min-h-[38px] cursor-pointer items-center gap-2.5 px-3.5 text-[13px] font-bold"
              :class="{ 'border-t': groupIndex > 0 }"
              @click="toggleGroup(group)"
              @keydown.space.prevent="toggleGroup(group)"
            >
              <UCheckbox
                :model-value="groupState(group)"
                tabindex="-1"
                class="pointer-events-none"
              />
              <span class="flex-1">{{ group.name }}</span>
              <span class="text-muted text-xs font-normal">{{ groupNote(group) }}</span>
            </div>
            <div
              v-for="item in group.items"
              :key="item.key"
              role="checkbox"
              :aria-checked="selected.has(item.key)"
              tabindex="0"
              class="border-default flex min-h-[38px] cursor-pointer items-center gap-2.5 border-t pr-3.5 pl-10 text-[13px]"
              @click="toggle(item.key)"
              @keydown.space.prevent="toggle(item.key)"
            >
              <UCheckbox
                :model-value="selected.has(item.key)"
                tabindex="-1"
                class="pointer-events-none"
              />
              <span class="flex-1 truncate">{{ item.name }}</span>
              <span
                v-if="connectionId && itemExists(group.key, item)"
                class="text-warning text-xs font-semibold"
              >
                Already exists{{
                  selected.has(item.key) ? ', will be duplicated' : ', will be skipped'
                }}
              </span>
              <span v-else-if="item.kind === 'chain'" class="text-muted text-xs">chain</span>
            </div>
          </template>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
          Import into
        </span>
        <div class="flex flex-wrap gap-2">
          <ConnectionSelect v-model="connectionId" class="min-w-0 flex-1" />
          <USelect
            v-model="targetGroupId"
            :items="groupItems"
            class="min-w-0 flex-1"
            aria-label="Group"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <span class="text-muted mr-auto text-xs">
        {{ selected.size }} of {{ allKeys.length }} selected
      </span>
      <UButton color="neutral" variant="outline" label="Cancel" @click="close" />
      <UButton
        label="Import"
        class="font-semibold"
        :disabled="!connectionId || !selected.size"
        @click="handleImport"
      />
    </template>
  </UModal>
</template>
