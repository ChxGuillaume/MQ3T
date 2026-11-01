<script setup lang="ts">
import { getPayloadVariablesGrouped } from '@renderer/assets/js/actions-variables'
import { hasGeneratedUuid } from './action-utils'
import { computed, ref } from 'vue'

const props = defineProps<{ payload: string }>()

const enumOptions = defineModel<Record<string, (string | number)[]>>('enumOptions', {
  required: true
})

const TYPE_LABELS = { string: 'text', number: 'number', boolean: 'boolean' } as const

const groups = computed(() => getPayloadVariablesGrouped(props.payload))

const enumNames = computed(() => {
  const fromPayload = Array.from(
    new Set(groups.value.find((g) => g.type === 'enum')?.variables.map((v) => v.name) ?? [])
  )
  const orphans = Object.keys(enumOptions.value).filter((name) => !fromPayload.includes(name))

  return [
    ...fromPayload.map((name) => ({ name, used: true })),
    ...orphans.map((name) => ({ name, used: false }))
  ]
})

const simpleVariables = computed(() => {
  const seen = new Set<string>()

  return groups.value
    .filter((g) => g.type !== 'enum')
    .flatMap((g) =>
      g.variables.map((v) => ({
        name: v.name,
        label: TYPE_LABELS[g.type as keyof typeof TYPE_LABELS]
      }))
    )
    .filter((v) => {
      const key = `${v.name}:${v.label}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
})

const hasUuid = computed(() => hasGeneratedUuid(props.payload))

const isEmpty = computed(
  () => !enumNames.value.length && !simpleVariables.value.length && !hasUuid.value
)

const drafts = ref<Record<string, string>>({})
const editing = ref<string | null>(null)

const parseOption = (raw: string): string | number | undefined => {
  const value = raw.trim()

  if (!value) return undefined
  if (/^".*"$/.test(value)) return value.slice(1, -1)
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)

  return value
}

const addOption = (name: string) => {
  const option = parseOption(drafts.value[name] ?? '')

  if (option === undefined) {
    editing.value = null
    return
  }

  enumOptions.value = {
    ...enumOptions.value,
    [name]: [...(enumOptions.value[name] ?? []), option]
  }
  drafts.value[name] = ''
}

const removeOption = (name: string, index: number) => {
  const options = [...(enumOptions.value[name] ?? [])]
  options.splice(index, 1)

  const next = { ...enumOptions.value }
  if (options.length) next[name] = options
  else delete next[name]

  enumOptions.value = next
}

const removeEnum = (name: string) => {
  const next = { ...enumOptions.value }
  delete next[name]
  enumOptions.value = next
}
</script>

<template>
  <section class="flex flex-col gap-2.5">
    <div class="flex items-center">
      <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">Variables</h2>
      <span class="text-muted ml-auto text-xs">Found in the payload</span>
    </div>

    <p v-if="isEmpty" class="text-muted text-xs">
      No variables yet. Add <span class="font-mono">$enum$mode$</span> to the payload to define a
      list of values.
    </p>

    <div
      v-for="enumName in enumNames"
      :key="enumName.name"
      class="border-default flex flex-col gap-2 rounded-lg border p-3"
    >
      <div class="flex items-center gap-2">
        <span
          class="rounded-xs px-1.5 py-px font-mono font-bold"
          :class="enumName.used ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'"
        >
          {{ enumName.name }}
        </span>
        <span class="text-muted text-xs">list</span>
        <template v-if="!enumName.used">
          <span class="text-warning text-xs">not in the payload</span>
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-trash-2"
            class="ml-auto"
            aria-label="Remove unused list"
            @click="removeEnum(enumName.name)"
          />
        </template>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="(option, index) in enumOptions[enumName.name] ?? []"
          :key="`${index}-${option}`"
          class="border-default inline-flex h-7 items-center gap-1.5 rounded-md border pr-1.5 pl-2.5 text-xs"
        >
          <span :class="typeof option === 'number' ? 'text-code-num font-mono' : ''">
            {{ option }}
          </span>
          <button
            type="button"
            class="text-muted hover:text-default"
            :aria-label="`Remove ${option}`"
            @click="removeOption(enumName.name, index)"
          >
            <UIcon name="i-lucide-x" class="size-3.5" />
          </button>
        </span>
        <UInput
          v-if="editing === enumName.name"
          v-model="drafts[enumName.name]"
          size="xs"
          autofocus
          placeholder="Value, Enter to add"
          class="w-40"
          @keydown.enter.prevent="addOption(enumName.name)"
          @keydown.esc="editing = null"
          @blur="addOption(enumName.name)"
        />
        <button
          v-else
          type="button"
          class="border-default text-muted hover:text-default inline-flex h-7 items-center rounded-md border border-dashed px-2.5 text-xs"
          @click="editing = enumName.name"
        >
          + Option
        </button>
      </div>
    </div>

    <div
      v-if="simpleVariables.length || hasUuid"
      class="text-muted flex flex-wrap gap-x-3.5 gap-y-1.5 text-xs"
    >
      <span v-for="variable in simpleVariables" :key="`${variable.name}:${variable.label}`">
        <span class="bg-primary/10 text-primary rounded-xs px-1.5 py-px font-mono font-bold">
          {{ variable.name }}
        </span>
        {{ variable.label }}
      </span>
      <span v-if="hasUuid">
        <span class="bg-primary/10 text-primary rounded-xs px-1.5 py-px font-mono font-bold">
          uuid
        </span>
        new UUID each send
      </span>
    </div>
    <p v-if="enumNames.length" class="text-dimmed text-[11px]">
      Numbers are stored as numbers. Wrap a value in quotes to keep it as text.
    </p>
  </section>
</template>
