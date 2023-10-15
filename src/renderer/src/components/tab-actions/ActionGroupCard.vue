<script setup lang="ts">
defineProps<{
  title: string
  active?: boolean
  description?: string
  cantModify?: boolean
}>()

defineEmits<{
  addAction: []
  delete: []
  export: []
  edit: []
}>()
</script>

<template>
  <q-card
    class="group-card tw-p-2 tw-h-fit tw-grid hover:tw-bg-primary/50 tw-transition-colors tw-cursor-pointer"
    :class="{ active }"
    flat
  >
    <div class="tw-my-1 tw-flex tw-justify-between tw-items-start">
      <div>
        <h2
          class="tw-text-lg tw-text-ellipsis tw-overflow-hidden tw-line-clamp-1 tw-select-none tw-cursor-pointer"
        >
          {{ title }}
        </h2>
        <p class="tw-line-clamp-3 color-details">{{ description }}</p>
      </div>
      <q-btn icon="fa-solid fa-ellipsis-vertical" flat round size="sm" @click.stop="() => {}">
        <q-menu anchor="bottom right" self="top right">
          <q-list style="min-width: 100px">
            <q-item class="tw-text-secondary" clickable v-close-popup @click="$emit('addAction')">
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-plus" class="tw-mr-2" />
                  Add Action
                </div>
              </q-item-section>
            </q-item>

            <q-separator v-if="!cantModify" />

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

            <q-item class="tw-text-teal-500" clickable v-close-popup @click="$emit('export')">
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-upload" class="tw-mr-2" />
                  Export
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>
  </q-card>
</template>

<style scoped lang="less">
.group-card.active {
  @apply tw-bg-primary/70 tw-text-white;
}

.body--light {
  .group-card {
    @apply tw-bg-neutral-100;
  }

  .group-card.active {
    @apply tw-bg-primary/70 tw-text-white;
  }
  .group-card.active .color-details {
    @apply tw-text-neutral-200;
  }
}
</style>
