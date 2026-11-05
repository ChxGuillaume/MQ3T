<script setup lang="ts">
import SelectConnectionAndGroupDialog from '../components/tab-actions/dialogs/SelectConnectionAndGroupDialog.vue'
import ActionsToDefaultGroupDialog from '../components/tab-actions/dialogs/ActionsToDefaultGroupDialog.vue'
import SelectConnectionDialog from '../components/tab-actions/dialogs/SelectConnectionDialog.vue'
import ShareActionGroupDialog from '../components/tab-actions/dialogs/ShareActionGroupDialog.vue'
import ActionGroupDialog from '../components/tab-actions/dialogs/ActionGroupDialog.vue'
import ChainActionCard from '../components/tab-actions/ChainActionCard.vue'
import ActionEditPage from '../components/tab-actions/ActionEditPage.vue'
import ConfirmDialog from '../components/tab-actions/dialogs/ConfirmDialog.vue'
import ChainEditor from '../components/tab-actions/ChainEditor.vue'
import { clone, DEFAULT_GROUP } from '../components/tab-actions/action-utils'
import ActionCard from '../components/tab-actions/ActionCard.vue'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { useChainActionsStore } from '../store/chain-actions'
import { useOverlay, useToast } from '@nuxt/ui/composables'
import { useMqttTopicsStore } from '../store/mqtt-topics'
import { ElectronApi } from '../assets/js/electron-api'
import type { ContextMenuItem } from '@nuxt/ui'
import { useActionsStore } from '../store/actions'
import { computed, ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { v4 as uuidV4 } from 'uuid'
import {
  Action,
  ActionGroup,
  ChainAction,
  ExportGroupsFile,
  ExportActionsFile,
  ExportChainActionsFile
} from '../../../types/actions'

type View =
  | { kind: 'list' }
  | { kind: 'action'; groupId: string; actionId?: string }
  | { kind: 'chain'; groupId: string; chainId?: string }

const ALL_GROUPS = 'all'

const mqttConnectionsStore = useMqttConnectionsStore()
const chainActionsStore = useChainActionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const actionsStore = useActionsStore()
const overlay = useOverlay()
const toast = useToast()

const confirmModal = overlay.create(ConfirmDialog)

const view = ref<View>({ kind: 'list' })
const search = ref('')
const selectedGroup = ref<string>(actionsStore.selectedActionGroup || 'default')

const selectedConnection = computed(() => mqttTopicsStore.selectedConnection)

const isDisconnected = computed(
  () => mqttConnectionsStore.getConnectionStatus(selectedConnection.value) !== 'connected'
)

const isRealGroup = computed(() => selectedGroup.value !== ALL_GROUPS)

const targetGroupId = computed(() => (isRealGroup.value ? selectedGroup.value : 'default'))

const selectGroup = (groupId: string) => {
  selectedGroup.value = groupId
  search.value = ''

  if (groupId !== ALL_GROUPS) actionsStore.setSelectedActionGroup(groupId)
}

watch(selectedConnection, () => {
  view.value = { kind: 'list' }

  const exists =
    selectedGroup.value === ALL_GROUPS ||
    selectedGroup.value === 'default' ||
    !!actionsStore.getConnectionGroup(selectedConnection.value, selectedGroup.value)

  selectGroup(exists ? selectedGroup.value : ALL_GROUPS)
})

const groups = computed({
  get: () => actionsStore.getConnectionGroups(selectedConnection.value),
  set: (value) => actionsStore.setSelectedConnectionGroups(value)
})

const sharedConnectionNames = (groupId: string) =>
  actionsStore
    .getGroupConnectionIds(groupId)
    .filter((id) => id !== selectedConnection.value)
    .map((id) => mqttConnectionsStore.getConnection(id)?.name ?? id)

const sharedGroupTitle = (groupId: string) =>
  `Shared with ${sharedConnectionNames(groupId).join(', ')}`

const isGroupDraggable = (event: { draggedContext: { element: ActionGroup } }) =>
  !actionsStore
    .getSharedGroupsForConnection(selectedConnection.value)
    .some((g) => g.id === event.draggedContext.element.id)

const currentGroup = computed<ActionGroup | undefined>(() => {
  if (selectedGroup.value === ALL_GROUPS) return undefined
  if (selectedGroup.value === 'default') return DEFAULT_GROUP

  return actionsStore.getConnectionGroup(selectedConnection.value, selectedGroup.value)
})

const groupCount = (groupId: string) =>
  actionsStore.getConnectionGroupActions(selectedConnection.value, groupId).length +
  chainActionsStore.getGroupChainActions(selectedConnection.value, groupId).length

const totalCount = computed(
  () =>
    actionsStore.getConnectionActions(selectedConnection.value).length +
    Object.values(chainActionsStore.getConnectionChainActions(selectedConnection.value)).flat()
      .length
)

const groupActions = computed({
  get: () => actionsStore.getConnectionGroupActions(selectedConnection.value, selectedGroup.value),
  set: (value) => {
    actionsStore.setSelectedActionGroup(selectedGroup.value)
    actionsStore.setSelectedConnectionGroupActions(value)
  }
})

const groupChains = computed({
  get: () => chainActionsStore.getGroupChainActions(selectedConnection.value, selectedGroup.value),
  set: (value) =>
    chainActionsStore.setConnectionGroupChainActions(
      selectedConnection.value,
      selectedGroup.value,
      value
    )
})

const normalizedSearch = computed(() => search.value.trim().toLowerCase())

const matchesSearch = (...values: (string | undefined)[]) =>
  !normalizedSearch.value ||
  values.some((value) => value?.toLowerCase().includes(normalizedSearch.value))

const visibleActions = computed(() => {
  const list = isRealGroup.value
    ? groupActions.value
    : actionsStore.getConnectionActions(selectedConnection.value)

  return list.filter((a) => matchesSearch(a.name, a.topic, a.description))
})

const visibleChains = computed(() => {
  const list = isRealGroup.value
    ? groupChains.value
    : Object.values(chainActionsStore.getConnectionChainActions(selectedConnection.value)).flat()

  return list.filter((c) => matchesSearch(c.name))
})

const canReorder = computed(() => isRealGroup.value && !normalizedSearch.value)

const sortableActions = computed({
  get: () => (canReorder.value ? groupActions.value : visibleActions.value),
  set: (value) => {
    if (canReorder.value) groupActions.value = value
  }
})

const sortableChains = computed({
  get: () => (canReorder.value ? groupChains.value : visibleChains.value),
  set: (value) => {
    if (canReorder.value) groupChains.value = value
  }
})

const findAction = (actionId: string): Action | undefined =>
  actionsStore.getConnectionActions(selectedConnection.value).find((a) => a.id === actionId)

const openAction = (action?: Action) => {
  view.value = {
    kind: 'action',
    groupId: action?.groupId ?? targetGroupId.value,
    actionId: action?.id
  }
}

const openChain = (chain?: ChainAction) => {
  view.value = { kind: 'chain', groupId: chain?.groupId ?? targetGroupId.value, chainId: chain?.id }
}

const editingChain = computed(() =>
  view.value.kind === 'chain' && view.value.chainId
    ? (chainActionsStore.getChainAction(view.value.chainId) ?? undefined)
    : undefined
)

const openSibling = (actionId?: string) => {
  if (view.value.kind === 'action') view.value = { ...view.value, actionId }
}

const backToList = () => {
  view.value = { kind: 'list' }
}

const handleDeleteAction = async (action: Action) => {
  const confirmed = await confirmModal.open({
    title: `Delete “${action.name}”?`,
    description: 'This action will be removed from the group.',
    confirmLabel: 'Delete',
    confirmIcon: 'i-lucide-trash-2',
    danger: true
  }).result

  if (!confirmed) return

  actionsStore.deleteActionFromConnectionGroup(action.id, selectedConnection.value, action.groupId)
}

const handleDeleteChain = async (chain: ChainAction) => {
  const confirmed = await confirmModal.open({
    title: `Delete “${chain.name}”?`,
    description: 'This chain will be removed from the group.',
    confirmLabel: 'Delete',
    confirmIcon: 'i-lucide-trash-2',
    danger: true
  }).result

  if (!confirmed) return

  chainActionsStore.deleteChainAction(selectedConnection.value, chain.groupId, chain.id)
}

const moveAction = ref({
  opened: false,
  type: 'copy' as 'copy' | 'move',
  kind: 'action' as 'action' | 'chain',
  id: '',
  fromGroupId: 'default',
  connectionId: '',
  groupId: 'default'
})

const openMoveDialog = (
  kind: 'action' | 'chain',
  type: 'copy' | 'move',
  item: { id: string; groupId: string }
) => {
  moveAction.value = {
    opened: true,
    type,
    kind,
    id: item.id,
    fromGroupId: item.groupId,
    connectionId: selectedConnection.value,
    groupId: item.groupId
  }
}

const handleMoveAction = () => {
  const { kind, type, id, fromGroupId, connectionId, groupId } = moveAction.value

  if (!connectionId || !groupId) return

  if (kind === 'action') {
    const action = findAction(id)

    if (!action) return

    actionsStore.addActionToConnectionGroup(action, connectionId, groupId)

    if (type === 'move') {
      actionsStore.deleteActionFromConnectionGroup(id, selectedConnection.value, fromGroupId)
    }
  } else {
    const chain = chainActionsStore.getChainAction(id)

    if (!chain) return

    chainActionsStore.copyChainAction(connectionId, groupId, chain)

    if (type === 'move') {
      chainActionsStore.deleteChainAction(selectedConnection.value, fromGroupId, id)
    }
  }
}

const groupDialog = ref({ opened: false, group: undefined as ActionGroup | undefined })

const moveGroup = ref({
  opened: false,
  type: 'copy' as 'copy' | 'move',
  connectionId: '',
  group: undefined as ActionGroup | undefined
})

const deleteGroupDialog = ref({ opened: false, groupId: '', actionCount: 0, chainActionCount: 0 })

const shareGroupDialog = ref({ opened: false, group: undefined as ActionGroup | undefined })

const handleUnshareGroup = (group: ActionGroup) => {
  actionsStore.unshareGroupFromConnection(group.id, selectedConnection.value)

  if (selectedGroup.value === group.id) selectGroup('default')
}

const handleDeleteGroup = async (groupId: string) => {
  if (actionsStore.isSharedGroup(groupId)) {
    const otherConnections = sharedConnectionNames(groupId)

    const confirmed = await confirmModal.open({
      title: `Delete “${actionsStore.findGroup(groupId)?.name}”?`,
      description: `This group is shared with ${otherConnections.join(', ')}. Deleting it removes it from every connection.`,
      confirmLabel: 'Delete everywhere',
      confirmIcon: 'i-lucide-trash-2',
      danger: true
    }).result

    if (!confirmed) return
  }

  const actionCount = actionsStore.getConnectionGroupActions(
    selectedConnection.value,
    groupId
  ).length
  const chainActionCount = chainActionsStore.getGroupChainActions(
    selectedConnection.value,
    groupId
  ).length

  if (actionCount || chainActionCount) {
    deleteGroupDialog.value = { opened: true, groupId, actionCount, chainActionCount }
    return
  }

  chainActionsStore.deleteGroupChainActions(selectedConnection.value, groupId)
  actionsStore.deleteActionGroup(groupId)

  if (selectedGroup.value === groupId) selectGroup('default')
}

const handleDeleteGroupDialog = (moveToDefault: boolean) => {
  const { groupId } = deleteGroupDialog.value

  chainActionsStore.deleteGroupChainActions(selectedConnection.value, groupId, moveToDefault)
  actionsStore.deleteActionGroup(groupId, moveToDefault)

  if (selectedGroup.value === groupId) selectGroup('default')
}

const handleMoveOrCopyGroup = () => {
  const { connectionId, group, type } = moveGroup.value

  if (!connectionId || !group) return

  const groupCopy = clone(group)
  const currentConnectionId = selectedConnection.value

  const chains = clone(chainActionsStore.getGroupChainActions(currentConnectionId, groupCopy.id))
  const actions = clone(actionsStore.getConnectionGroupActions(currentConnectionId, groupCopy.id))

  const newGroup = actionsStore.addActionGroupToConnection(groupCopy, connectionId)

  for (const chain of chains) chainActionsStore.addChainAction(connectionId, newGroup.id, chain)
  for (const action of actions)
    actionsStore.addActionToConnectionGroup(action, connectionId, newGroup.id)

  if (type === 'move') {
    chainActionsStore.deleteGroupChainActions(currentConnectionId, groupCopy.id, false)
    actionsStore.deleteActionGroupFromConnection(currentConnectionId, groupCopy.id)

    if (selectedGroup.value === groupCopy.id) selectGroup('default')
  }
}

const exportJson = (fileName: string, data: unknown) => {
  ElectronApi.exportData(fileName, JSON.stringify(clone(data)), [
    { name: 'JSON', extensions: ['json'] }
  ])
}

const handleChainActionsExport = (groupId: string) => {
  exportJson('mq3t-chain-actions.json', {
    version: 1,
    type: 'chain-actions',
    chainActions: chainActionsStore.getGroupChainActions(selectedConnection.value, groupId)
  } as ExportChainActionsFile)
}

const handleActionsExport = (groupId: string) => {
  exportJson('mq3t-actions.json', {
    version: 1,
    type: 'actions',
    actions: actionsStore.getConnectionGroupActions(selectedConnection.value, groupId)
  } as ExportActionsFile)
}

const handleGroupExport = (groupId: string) => {
  const group =
    groupId === 'default'
      ? { id: `group-${uuidV4()}`, name: 'Exported Default' }
      : actionsStore.getConnectionGroup(selectedConnection.value, groupId)

  if (!group) return

  const { sharedWith: _, ...exportedGroup } = group

  exportJson('mq3t-group.json', {
    version: 1,
    type: 'groups',
    groups: [exportedGroup],
    actions: {
      [group.id]: actionsStore.getConnectionGroupActions(selectedConnection.value, groupId)
    },
    chainActions: {
      [group.id]: chainActionsStore.getGroupChainActions(selectedConnection.value, groupId)
    }
  } as ExportGroupsFile)
}

const handleConnectionExport = () => {
  const allChainActions = clone(
    chainActionsStore.getConnectionChainActions(selectedConnection.value)
  )
  const allActions = Object.fromEntries(
    [DEFAULT_GROUP, ...actionsStore.getConnectionGroups(selectedConnection.value)].map((group) => [
      group.id,
      clone(actionsStore.getConnectionGroupActions(selectedConnection.value, group.id))
    ])
  )
  const allGroups: ActionGroup[] = actionsStore
    .getConnectionGroups(selectedConnection.value)
    .map(({ sharedWith: _, ...group }) => group)

  if (allActions['default']?.length || allChainActions['default']?.length) {
    const groupId = `group-${uuidV4()}`

    allGroups.push({ id: groupId, name: 'Exported Default' })

    if (allActions['default']) {
      allActions[groupId] = allActions['default'].map((action) => ({ ...action, groupId }))
      delete allActions['default']
    }

    if (allChainActions['default']) {
      allChainActions[groupId] = allChainActions['default'].map((chain) => ({ ...chain, groupId }))
      delete allChainActions['default']
    }
  }

  exportJson('mq3t-groups-actions.json', {
    version: 1,
    type: 'groups',
    groups: allGroups,
    actions: allActions,
    chainActions: allChainActions
  } as ExportGroupsFile)
}

const handleImport = () => {
  ElectronApi.importData([{ name: 'JSON', extensions: ['json'] }])
}

const groupMenuItems = (group: ActionGroup): ContextMenuItem[][] => {
  const isDefault = group.id === 'default'
  const isShared = !isDefault && actionsStore.isSharedGroup(group.id)

  return [
    isDefault
      ? []
      : [
          {
            label: 'Edit',
            icon: 'i-lucide-pencil',
            onSelect: () => (groupDialog.value = { opened: true, group })
          },
          {
            label: 'Share with connections…',
            icon: 'i-lucide-link',
            onSelect: () => (shareGroupDialog.value = { opened: true, group })
          },
          ...(isShared
            ? [
                {
                  label: 'Remove from this connection',
                  icon: 'i-lucide-unlink',
                  onSelect: () => handleUnshareGroup(group)
                }
              ]
            : [])
        ],
    [
      {
        label: 'Copy to connection…',
        icon: 'i-lucide-copy',
        onSelect: () =>
          (moveGroup.value = {
            opened: true,
            type: 'copy',
            connectionId: selectedConnection.value,
            group: isDefault ? { id: 'default', name: 'Default Copy' } : group
          })
      },
      ...(isDefault || isShared
        ? []
        : [
            {
              label: 'Move to connection…',
              icon: 'i-lucide-arrow-right-left',
              onSelect: () =>
                (moveGroup.value = {
                  opened: true,
                  type: 'move',
                  connectionId: selectedConnection.value,
                  group
                })
            }
          ])
    ],
    [
      {
        label: 'Export group',
        icon: 'i-lucide-upload',
        onSelect: () => handleGroupExport(group.id)
      },
      {
        label: 'Export actions',
        icon: 'i-lucide-upload',
        onSelect: () => handleActionsExport(group.id)
      },
      {
        label: 'Export chains',
        icon: 'i-lucide-upload',
        onSelect: () => handleChainActionsExport(group.id)
      }
    ],
    isDefault
      ? []
      : [
          {
            label: 'Delete',
            icon: 'i-lucide-trash-2',
            color: 'error' as const,
            onSelect: () => handleDeleteGroup(group.id)
          }
        ]
  ].filter((section) => section.length)
}

const dropTarget = ref<string | null>(null)
const draggingItem = ref(false)

const handleItemDragStart = (event: DragEvent, id: string) => {
  event.dataTransfer?.setData('actionId', id)
  draggingItem.value = true
}

const handleGroupDrop = (event: DragEvent, groupId: string) => {
  dropTarget.value = null
  draggingItem.value = false

  const id = event.dataTransfer?.getData('actionId')

  if (!id) return

  if (id.startsWith('chain-action-')) {
    const chain = chainActionsStore.getChainAction(id)

    if (!chain || chain.groupId === groupId) return

    chainActionsStore.copyChainAction(selectedConnection.value, groupId, chain)
    chainActionsStore.deleteChainAction(selectedConnection.value, chain.groupId, chain.id)
  } else {
    const action = findAction(id)

    if (!action || action.groupId === groupId) return

    actionsStore.addActionToConnectionGroup(action, selectedConnection.value, groupId)
    actionsStore.deleteActionFromConnectionGroup(id, selectedConnection.value, action.groupId)
  }

  toast.add({ title: 'Moved', icon: 'i-lucide-folder-input', duration: 1200 })
}

const groupDropHandlers = (groupId: string) => ({
  onDragenter: (event: DragEvent) => {
    if (!event.dataTransfer?.types.includes('actionid')) return
    event.preventDefault()
    dropTarget.value = groupId
  },
  onDragover: (event: DragEvent) => {
    if (event.dataTransfer?.types.includes('actionid')) event.preventDefault()
  },
  onDragleave: () => {
    if (dropTarget.value === groupId) dropTarget.value = null
  },
  onDrop: (event: DragEvent) => handleGroupDrop(event, groupId)
})

const navItemClass = (groupId: string) => [
  dropTarget.value === groupId
    ? 'bg-success/15 text-success ring-success ring-1 ring-inset'
    : selectedGroup.value === groupId
      ? 'bg-primary/10 text-primary font-bold'
      : 'hover:bg-muted font-medium'
]

const pageTitle = computed(() => currentGroup.value?.name ?? 'All actions')

const pageDescription = computed(() => {
  if (!currentGroup.value) return 'Every action and chain on this connection'
  if (currentGroup.value.id === 'default') return 'Actions that are not in a group'
  return currentGroup.value.description
})

const isEmpty = computed(() => !visibleActions.value.length && !visibleChains.value.length)
</script>

<template>
  <div class="h-full min-h-0">
    <ActionEditPage
      v-if="view.kind === 'action'"
      :connection-id="selectedConnection"
      :group-id="view.groupId"
      :action-id="view.actionId"
      @back="backToList"
      @open="openSibling"
      @create="openSibling()"
    />

    <ChainEditor
      v-else-if="view.kind === 'chain'"
      :key="view.chainId ?? 'new'"
      :connection-id="selectedConnection"
      :group-id="view.groupId"
      :chain-action="editingChain"
      @back="backToList"
    />

    <div v-else class="flex h-full min-h-0">
      <nav
        aria-label="Action groups"
        class="border-default flex w-[260px] shrink-0 flex-col gap-0.5 border-r px-3 py-4"
      >
        <div class="text-muted px-2.5 pb-2 text-[11px] font-semibold tracking-[0.1em] uppercase">
          Groups
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto">
          <button
            type="button"
            class="flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-[13px]"
            :class="navItemClass(ALL_GROUPS)"
            @click="selectGroup(ALL_GROUPS)"
          >
            <span class="flex-1 text-left">All</span>
            <span class="text-muted text-xs font-medium">{{ totalCount }}</span>
          </button>

          <UContextMenu :items="groupMenuItems(DEFAULT_GROUP)">
            <button
              type="button"
              class="group flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-[13px]"
              :class="navItemClass('default')"
              v-bind="groupDropHandlers('default')"
              @click="selectGroup('default')"
            >
              <span class="flex-1 text-left">Default</span>
              <span class="text-muted text-xs font-medium">{{ groupCount('default') }}</span>
            </button>
          </UContextMenu>

          <draggable
            v-model="groups"
            :animation="200"
            group="groups"
            item-key="id"
            :move="isGroupDraggable"
            ghost-class="opacity-40"
            class="flex flex-col gap-0.5"
          >
            <template #item="{ element }">
              <div>
                <UContextMenu :items="groupMenuItems(element)">
                  <div
                    role="button"
                    tabindex="0"
                    class="group flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-[13px]"
                    :class="navItemClass(element.id)"
                    :title="element.description"
                    v-bind="groupDropHandlers(element.id)"
                    @click="selectGroup(element.id)"
                    @keydown.enter="selectGroup(element.id)"
                  >
                    <span class="min-w-0 flex-1 truncate text-left">{{ element.name }}</span>
                    <UTooltip
                      v-if="actionsStore.isSharedGroup(element.id)"
                      :text="sharedGroupTitle(element.id)"
                    >
                      <UIcon name="i-lucide-link" class="text-muted size-3.5 shrink-0" />
                    </UTooltip>
                    <span class="flex shrink-0 items-center">
                      <span class="text-muted text-xs font-medium group-hover:hidden">
                        {{ groupCount(element.id) }}
                      </span>
                      <UDropdownMenu :items="groupMenuItems(element)" :content="{ align: 'start' }">
                        <UButton
                          color="neutral"
                          variant="ghost"
                          size="xs"
                          icon="i-lucide-ellipsis"
                          aria-label="Group options"
                          class="-my-1 -mr-1.5 hidden group-hover:inline-flex"
                          @click.stop
                        />
                      </UDropdownMenu>
                    </span>
                  </div>
                </UContextMenu>
              </div>
            </template>
          </draggable>

          <button
            type="button"
            class="text-muted hover:bg-muted hover:text-default flex h-9 shrink-0 items-center gap-2 rounded-lg px-2.5 text-[13px]"
            @click="groupDialog = { opened: true, group: undefined }"
          >
            <UIcon name="i-lucide-plus" class="size-3.5" />
            New group
          </button>
        </div>

        <div class="mt-3 flex gap-1.5 px-1">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-download"
            label="Import"
            block
            class="flex-1"
            @click="handleImport"
          />
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-upload"
            label="Export"
            block
            class="flex-1"
            :disabled="!selectedConnection"
            @click="handleConnectionExport"
          />
        </div>
      </nav>

      <main class="flex min-w-0 flex-1 flex-col gap-[22px] overflow-auto px-6 py-5">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div class="min-w-0">
            <div class="flex min-w-0 items-center gap-2">
              <h1 class="truncate text-2xl leading-[30px] font-bold">{{ pageTitle }}</h1>
              <UBadge
                v-if="currentGroup && actionsStore.isSharedGroup(currentGroup.id)"
                color="neutral"
                variant="subtle"
                icon="i-lucide-link"
                :label="sharedGroupTitle(currentGroup.id)"
                class="shrink-0"
              />
            </div>
            <p v-if="pageDescription" class="text-muted mt-1 text-[13px]">{{ pageDescription }}</p>
          </div>
          <div class="flex gap-2">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Search actions"
              class="w-[220px]"
            />
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-workflow"
              label="New chain"
              @click="openChain()"
            />
            <UButton
              color="primary"
              variant="outline"
              icon="i-lucide-plus"
              label="New action"
              class="font-semibold"
              @click="openAction()"
            />
          </div>
        </div>

        <div
          v-if="isEmpty"
          class="border-default flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center"
        >
          <UIcon
            :name="normalizedSearch ? 'i-lucide-search-x' : 'i-lucide-send'"
            class="text-muted size-8"
          />
          <template v-if="normalizedSearch">
            <h2 class="font-bold">No match for “{{ search }}”</h2>
            <p class="text-muted text-[13px]">Try another name or topic.</p>
          </template>
          <template v-else>
            <h2 class="font-bold">No actions here yet</h2>
            <p class="text-muted max-w-sm text-[13px]">
              Actions are saved messages you can send in one click. Chains run several of them in
              order.
            </p>
            <div class="flex gap-2">
              <UButton color="neutral" variant="outline" label="New chain" @click="openChain()" />
              <UButton label="New action" class="font-semibold" @click="openAction()" />
            </div>
          </template>
        </div>

        <section v-if="visibleChains.length" class="flex flex-col gap-2.5">
          <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">Chains</h2>
          <draggable
            v-model="sortableChains"
            :disabled="!canReorder"
            :animation="200"
            group="chain-actions"
            handle=".drag-handle"
            item-key="id"
            ghost-class="opacity-40"
            class="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-3"
            @end="draggingItem = false"
          >
            <template #item="{ element: chain }">
              <div
                :draggable="canReorder ? undefined : 'true'"
                @dragstart="handleItemDragStart($event, chain.id)"
                @dragend="draggingItem = false"
              >
                <ChainActionCard
                  :chain-action="chain"
                  :connection-id="selectedConnection"
                  :disable="isDisconnected"
                  @edit="openChain(chain)"
                  @copy="openMoveDialog('chain', 'copy', chain)"
                  @move="openMoveDialog('chain', 'move', chain)"
                  @delete="handleDeleteChain(chain)"
                />
              </div>
            </template>
          </draggable>
        </section>

        <section v-if="visibleActions.length" class="flex flex-col gap-2.5">
          <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">Actions</h2>
          <draggable
            v-model="sortableActions"
            :disabled="!canReorder"
            :animation="200"
            group="actions"
            handle=".drag-handle"
            item-key="id"
            ghost-class="opacity-40"
            class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3"
            @end="draggingItem = false"
          >
            <template #item="{ element: action }">
              <div
                :draggable="canReorder ? undefined : 'true'"
                @dragstart="handleItemDragStart($event, action.id)"
                @dragend="draggingItem = false"
              >
                <ActionCard
                  :action="action"
                  :connection-id="selectedConnection"
                  :disable-disconnected="isDisconnected"
                  @edit="openAction(action)"
                  @copy="openMoveDialog('action', 'copy', action)"
                  @move="openMoveDialog('action', 'move', action)"
                  @delete="handleDeleteAction(action)"
                />
              </div>
            </template>
          </draggable>
        </section>

        <p v-if="!isEmpty && draggingItem" class="text-muted text-center text-xs">
          Drop on a group on the left to move it there.
        </p>
      </main>
    </div>

    <ActionGroupDialog
      v-model:opened="groupDialog.opened"
      :edit-mode="!!groupDialog.group"
      :action-group="groupDialog.group"
      @create:action-group="actionsStore.addActionGroup($event)"
      @update:action-group="actionsStore.updateActionGroup($event)"
    />
    <ShareActionGroupDialog
      v-model:opened="shareGroupDialog.opened"
      :connection-id="selectedConnection"
      :group="shareGroupDialog.group"
    />
    <SelectConnectionDialog
      v-model:opened="moveGroup.opened"
      v-model:connection-id="moveGroup.connectionId"
      :title="moveGroup.type === 'copy' ? 'Copy group' : 'Move group'"
      :description="`“${moveGroup.group?.name}” and everything in it.`"
      :action-title="moveGroup.type === 'copy' ? 'Copy' : 'Move'"
      :action-icon="moveGroup.type === 'copy' ? 'i-lucide-copy' : 'i-lucide-arrow-right-left'"
      @input="handleMoveOrCopyGroup"
    />
    <SelectConnectionAndGroupDialog
      v-model:opened="moveAction.opened"
      v-model:connection-id="moveAction.connectionId"
      v-model:group-id="moveAction.groupId"
      :title="`${moveAction.type === 'copy' ? 'Copy' : 'Move'} ${moveAction.kind === 'chain' ? 'chain' : 'action'}`"
      :action-title="moveAction.type === 'copy' ? 'Copy' : 'Move'"
      :action-icon="moveAction.type === 'copy' ? 'i-lucide-copy' : 'i-lucide-arrow-right-left'"
      @input="handleMoveAction"
    />
    <ActionsToDefaultGroupDialog
      v-model:opened="deleteGroupDialog.opened"
      :action-count="deleteGroupDialog.actionCount"
      :chain-actions-count="deleteGroupDialog.chainActionCount"
      @actions:move="handleDeleteGroupDialog(true)"
      @actions:delete="handleDeleteGroupDialog(false)"
    />
  </div>
</template>
