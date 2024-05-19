<script setup lang="ts">
defineProps<{
  hideCopyLastMessage?: boolean
}>()

defineEmits(['copyLastMessage', 'copyTopic', 'copyTopicKey', 'erase'])
</script>

<template>
  <q-menu anchor="center end" self="center left" context-menu>
    <q-list class="tw-min-w-[150px]">
      <q-item class="tw-text-secondary" clickable v-close-popup @click="$emit('copyTopic')">
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-copy" class="tw-mr-2" />
            Copy Topic
          </div>
        </q-item-section>
      </q-item>

      <q-item class="tw-text-secondary" clickable v-close-popup @click="$emit('copyTopicKey')">
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-copy" class="tw-mr-2" />
            Copy Topic Key
          </div>
        </q-item-section>
      </q-item>

      <q-item
        class="tw-text-secondary"
        clickable
        v-close-popup
        @click="$emit('copyLastMessage')"
        :disable="hideCopyLastMessage"
      >
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-copy" class="tw-mr-2" />
            Copy Last Message
          </div>
        </q-item-section>
      </q-item>

      <q-item class="tw-text-red-500" clickable v-close-popup @click="$emit('erase')">
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-eraser" class="tw-mr-2" />
            Erase
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<style scoped lang="less"></style>
