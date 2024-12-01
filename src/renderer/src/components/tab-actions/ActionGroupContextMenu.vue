<script setup lang="ts">
import { QMenu } from 'quasar'

withDefaults(
  defineProps<{
    contextMenu?: boolean
    cantModify?: boolean
    notMovable?: boolean
    anchor?: QMenu['anchor']
    self?: QMenu['self']
  }>(),
  {
    anchor: 'bottom right',
    self: 'top right'
  }
)

defineEmits([
  'edit',
  'delete',
  'copy',
  'move',
  'export:chain-actions',
  'export:actions',
  'export:group'
])
</script>

<template>
  <q-menu :anchor="anchor" :self="self" :context-menu="contextMenu">
    <q-list style="min-width: 170px">
      <q-item
        v-if="!cantModify"
        class="tw-text-blue-500"
        clickable
        v-close-popup
        @click="$emit('edit')"
      >
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-edit" class="tw-mr-2" />
            Edit
          </div>
        </q-item-section>
      </q-item>
      <q-item
        v-if="!cantModify"
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

      <q-item class="tw-text-amber-500" clickable v-close-popup @click="$emit('copy')">
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-copy" class="tw-mr-2" />
            Copy
          </div>
        </q-item-section>
      </q-item>

      <q-item
        v-if="!notMovable"
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

      <q-separator />

      <q-item class="tw-text-teal-500" clickable v-close-popup @click="$emit('export:group')">
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-upload" class="tw-mr-2" />
            Export Group
          </div>
        </q-item-section>
      </q-item>

      <q-item class="tw-text-teal-500" clickable v-close-popup @click="$emit('export:actions')">
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-upload" class="tw-mr-2" />
            Export Actions
          </div>
        </q-item-section>
      </q-item>

      <q-item
        class="tw-text-teal-500"
        clickable
        v-close-popup
        @click="$emit('export:chain-actions')"
      >
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-upload" class="tw-mr-2" />
            Export Chain Actions
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<style scoped lang="less"></style>
