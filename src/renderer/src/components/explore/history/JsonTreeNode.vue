<script setup lang="ts">
import {
  childPath,
  hasChangeBelow,
  isContainer,
  jsonTreeContextKey,
  matchesFind,
  tableColumns,
  valueClass
} from './json-tree-context'
import { compactValue } from '@renderer/assets/js/payload-insight'
import type { ContextMenuItem } from '@nuxt/ui'
import { computed, inject } from 'vue'

defineOptions({ name: 'JsonTreeNode' })

const props = defineProps<{ name: string; value: unknown; path: string; depth: number }>()

const context = inject(jsonTreeContextKey)!

const change = computed(() => context.changes.value.get(props.path))

const container = computed(() => isContainer(props.value))

const entries = computed(() => {
  if (!isContainer(props.value)) return []

  const list = Array.isArray(props.value)
    ? props.value.map((item, index) => ({
        key: String(index),
        value: item,
        path: childPath(props.path, index)
      }))
    : Object.entries(props.value).map(([key, item]) => ({
        key,
        value: item,
        path: childPath(props.path, key)
      }))

  return list.filter(
    (entry) =>
      (!context.onlyChanges.value || hasChangeBelow(context.changes.value, entry.path)) &&
      matchesFind(entry.key, entry.value, context.find.value)
  )
})

const columns = computed(() => (Array.isArray(props.value) ? tableColumns(props.value) : null))

const expanded = computed(() => !!context.find.value || context.isExpanded(props.path, props.depth))

const summary = computed(() => {
  if (!isContainer(props.value)) return ''

  const count = Array.isArray(props.value) ? props.value.length : Object.keys(props.value).length
  const noun = Array.isArray(props.value) ? 'items' : 'keys'

  if (columns.value && expanded.value) return `${count} items · shown as a table`

  return Array.isArray(props.value) ? `[${count} ${noun}]` : `{${count} ${noun}}`
})

const menuItems = computed(() => context.keyMenu(props.path, props.value) as ContextMenuItem[][])

const cellChange = (index: number, column: string) =>
  context.changes.value.get(`${childPath(props.path, index)}.${column}`)
</script>

<template>
  <div>
    <UContextMenu :items="menuItems">
      <div
        class="flex min-h-[30px] items-center gap-2.5 rounded-md px-2.5"
        :class="{ 'bg-primary/10': change }"
      >
        <button
          v-if="container"
          type="button"
          class="text-muted w-3 shrink-0"
          :aria-label="expanded ? 'Collapse' : 'Expand'"
          :aria-expanded="expanded"
          @click="context.toggle(path, depth)"
        >
          {{ expanded ? '▾' : '▸' }}
        </button>
        <span v-else class="w-3 shrink-0" />
        <span class="text-primary">{{ name }}</span>
        <span v-if="container" class="text-muted font-sans text-xs">{{ summary }}</span>
        <span v-else :class="valueClass(value)" class="break-all">{{
          compactValue(value, 200)
        }}</span>
        <span v-if="change?.type === 'changed'" class="text-muted text-xs">
          was {{ compactValue(change.before) }}
        </span>
        <span
          v-else-if="change?.type === 'added'"
          class="bg-primary/10 text-primary rounded-full px-1.5 text-[11px] font-bold"
        >
          new
        </span>
      </div>
    </UContextMenu>

    <div v-if="container && expanded" class="border-default ml-4 border-l pl-2">
      <table v-if="columns" class="my-1 border-collapse text-xs">
        <thead>
          <tr class="text-muted">
            <th scope="col" class="px-2 py-1 text-left font-semibold">#</th>
            <th
              v-for="column in columns"
              :key="column"
              scope="col"
              class="px-2 py-1 text-left font-semibold"
            >
              {{ column }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in value as Record<string, unknown>[]"
            :key="index"
            class="border-default border-t"
          >
            <td class="text-muted px-2 py-1">{{ index }}</td>
            <td
              v-for="column in columns"
              :key="column"
              class="px-2 py-1"
              :class="[valueClass(row[column]), { 'bg-primary/10': cellChange(index, column) }]"
            >
              {{ compactValue(row[column], 60) }}
              <span v-if="cellChange(index, column)" class="text-muted">
                was {{ compactValue(cellChange(index, column)?.before) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <template v-else>
        <JsonTreeNode
          v-for="entry in entries"
          :key="entry.key"
          :name="entry.key"
          :value="entry.value"
          :path="entry.path"
          :depth="depth + 1"
        />
      </template>
    </div>
  </div>
</template>
