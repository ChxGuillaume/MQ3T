<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <q-card flat class="tw-p-4 tw-h-fit">
    <div class="tw-flex tw-justify-between">
      <p
        class="tw-text-lg tw-text-ellipsis tw-overflow-hidden tw-break-all tw-line-clamp-1"
        :title="title"
      >
        {{ title }}
      </p>
      <q-btn class="tw-ml-2" icon="fa-solid fa-ellipsis-vertical" flat round size="sm">
        <q-menu anchor="bottom right" self="top right">
          <q-list class="tw-min-w-[150px]">
            <q-item class="tw-text-blue-500" clickable v-close-popup>
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-edit" class="tw-mr-2" />
                  Edit
                </div>
              </q-item-section>
            </q-item>
            <q-item class="tw-text-amber-500" clickable v-close-popup>
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-copy" class="tw-mr-2" />
                  Copy
                </div>
              </q-item-section>
            </q-item>
            <q-item class="tw-text-amber-500" clickable v-close-popup>
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-right-left" class="tw-mr-2" />
                  Move
                </div>
              </q-item-section>
            </q-item>
            <q-item class="tw-text-red-500" clickable v-close-popup>
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-trash" class="tw-mr-2" />
                  Delete
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>
    <div class="tw-mt-4 tw-flex tw-justify-end">
      <q-btn color="primary" label="Send" />
    </div>
  </q-card>
</template>

<style scoped lang="less"></style>
