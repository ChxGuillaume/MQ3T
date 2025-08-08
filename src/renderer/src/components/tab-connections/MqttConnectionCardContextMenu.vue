<script setup lang="ts">
import { QMenu } from 'quasar'

withDefaults(
  defineProps<{
    contextMenu?: boolean
    anchor?: QMenu['anchor']
    self?: QMenu['self']
  }>(),
  {
    contextMenu: false,
    anchor: 'bottom right',
    self: 'top right'
  }
)

defineEmits(['edit', 'delete', 'copy', 'move'])
</script>

<template>
  <q-menu :anchor="anchor" :self="self" :context-menu="contextMenu">
    <q-list class="tw-min-w-[150px]">
      <q-item v-close-popup class="tw-text-blue-500" clickable @click="$emit('edit')">
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-edit" class="tw-mr-2" />
            Edit
          </div>
        </q-item-section>
      </q-item>

      <q-item v-close-popup class="tw-text-red-500" clickable @click="$emit('delete')">
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-trash" class="tw-mr-2" />
            Delete
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<style scoped lang="less"></style>
