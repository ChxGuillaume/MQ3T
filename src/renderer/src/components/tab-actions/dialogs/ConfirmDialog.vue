<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    confirmLabel?: string
    confirmIcon?: string
    danger?: boolean
  }>(),
  { confirmLabel: 'Confirm' }
)

const emit = defineEmits<{ close: [confirmed: boolean] }>()
</script>

<template>
  <UModal
    :title="title"
    :description="description"
    :close="{ onClick: () => emit('close', false) }"
    :ui="{ content: 'sm:max-w-md', footer: 'justify-end' }"
  >
    <template #footer>
      <UButton color="neutral" variant="outline" label="Cancel" @click="emit('close', false)" />
      <UButton
        :color="danger ? 'error' : 'primary'"
        :icon="confirmIcon"
        :label="confirmLabel"
        class="font-semibold"
        autofocus
        @click="emit('close', true)"
      />
    </template>
  </UModal>
</template>
