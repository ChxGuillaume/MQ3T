<script setup lang="ts">
const props = defineProps<{
  hasLastMessage?: boolean
  favorite?: boolean
}>()

const emit = defineEmits([
  'copyLastMessage',
  'copyTopic',
  'copyTopicKey',
  'erase',
  'favorite',
  'unfavorite'
])

const handleFavorite = () => {
  if (props.favorite) emit('unfavorite')
  else emit('favorite')
}
</script>

<template>
  <q-menu anchor="center end" self="center left" context-menu>
    <q-list class="tw-min-w-[150px]">
      <q-item
        :disable="hasLastMessage"
        class="tw-text-yellow-500"
        clickable
        v-close-popup
        @click="handleFavorite"
      >
        <q-item-section>
          <div>
            <q-icon v-if="favorite" name="fa-regular fa-star" class="tw-mr-2" />
            <q-icon v-else name="fa-solid fa-star" class="tw-mr-2" />
            {{ favorite ? 'Unfavorite' : 'Favorite' }}
          </div>
        </q-item-section>
      </q-item>

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
        :disable="hasLastMessage"
        class="tw-text-secondary"
        clickable
        v-close-popup
        @click="$emit('copyLastMessage')"
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
