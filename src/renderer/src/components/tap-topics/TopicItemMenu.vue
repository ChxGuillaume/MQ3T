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
  'unfavorite',
  'export:raw',
  'export:json',
  'export:csv'
])

const handleFavorite = () => {
  if (props.favorite) emit('unfavorite')
  else emit('favorite')
}
</script>

<template>
  <q-menu anchor="bottom left" self="top left" context-menu>
    <q-list class="tw-min-w-[150px]" dense>
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

      <q-item :disable="hasLastMessage" class="tw-text-accent" clickable>
        <q-item-section>
          <div>
            <q-icon name="fa-solid fa-file-arrow-down" class="tw-mr-2" />
            Export
          </div>
        </q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right" color="accent" />
        </q-item-section>

        <q-menu anchor="top end" self="top start">
          <q-list dense>
            <q-item clickable v-ripple @click="$emit('export:raw')">
              <q-item-section>
                <div>
                  <q-icon name="reorder" class="tw-mr-2" />
                  RAW
                </div>
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple @click="$emit('export:json')">
              <q-item-section>
                <div>
                  <q-icon name="data_object" class="tw-mr-2" />
                  JSON
                </div>
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple @click="$emit('export:csv')">
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-file-csv" class="tw-mr-2" />
                  CSV
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
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
