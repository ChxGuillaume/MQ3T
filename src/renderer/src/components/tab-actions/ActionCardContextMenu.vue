<script setup lang="ts">
import { QMenu } from 'quasar'

withDefaults(
  defineProps<{
    contextMenu?: boolean
    anchor?: QMenu['anchor']
    self?: QMenu['self']
    editOnly?: boolean
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
      <q-item class="tw-text-blue-500" clickable v-close-popup @click="$emit('edit')">
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-edit" class="tw-mr-2" />
            Edit
          </div>
        </q-item-section>
      </q-item>

      <q-item
        v-if="!editOnly"
        class="tw-text-red-500"
        clickable
        v-close-popup
        @click="$emit('delete')"
      >
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-trash" class="tw-mr-2" />
            Delete
          </div>
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item
        v-if="!editOnly"
        class="tw-text-amber-500"
        clickable
        v-close-popup
        @click="$emit('copy')"
      >
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-copy" class="tw-mr-2" />
            Copy
          </div>
        </q-item-section>
      </q-item>

      <q-item
        v-if="!editOnly"
        class="tw-text-amber-500"
        clickable
        v-close-popup
        @click="$emit('move')"
      >
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-right-left" class="tw-mr-2" />
            Move
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<style scoped lang="less"></style>
