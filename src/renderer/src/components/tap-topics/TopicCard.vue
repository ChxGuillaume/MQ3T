<script setup lang="ts">
const props = defineProps<{
  active?: boolean
  opened?: boolean
  expandable?: boolean
}>()

defineEmits(['open:toggle'])
</script>

<template>
  <q-card
    flat
    class="topic-item-card card-secondary-background tw-pr-3 tw-select-none"
    :class="{ active, opened, 'tw-pl-1': expandable, 'tw-pl-3': !expandable }"
    @click.stop="$emit('open:toggle')"
  >
    <q-icon
      v-if="expandable"
      name="fa-solid fa-caret-right"
      size="xs"
      class="expand-icon tw-mr-1"
    />
    <slot />
  </q-card>
</template>

<style scoped lang="less">
.opened {
  .expand-icon {
    transform: rotate(90deg);
  }
}

.topic-item-card {
  @apply tw-py-1 tw-line-clamp-1 tw-cursor-pointer tw-transition-colors;
}

.body--light {
  .topic-item-card:hover {
    background: #65016433 !important;
  }

  .topic-item-card.active {
    background: #65016455 !important;
  }
}

.body--dark {
  .topic-item-card:hover {
    background: #65016488 !important;
  }

  .topic-item-card.active {
    background: #650164ee !important;
  }
}
</style>
