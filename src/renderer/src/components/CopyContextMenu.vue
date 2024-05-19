<script setup lang="ts">
import { QMenu } from 'quasar'

withDefaults(
  defineProps<{
    contextMenu?: boolean
    anchor?: QMenu['anchor']
    self?: QMenu['self']
  }>(),
  {
    contextMenu: true,
    anchor: 'bottom right',
    self: 'top right'
  }
)

defineEmits(['copy'])
</script>

<template>
  <q-menu :anchor="anchor" :self="self" :context-menu="contextMenu">
    <q-list class="tw-min-w-[150px]">
      <q-item class="tw-text-secondary" clickable v-close-popup @click="$emit('copy')">
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-copy" class="tw-mr-2" />
            Copy
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<style scoped lang="less"></style>
