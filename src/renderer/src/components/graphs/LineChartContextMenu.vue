<script setup lang="ts">
import { QMenu, useQuasar } from 'quasar'
import colors from 'tailwindcss/colors'

const $q = useQuasar()

const graphColors = Object.keys(colors)
  .filter((c) => !c.endsWith('Blue') && !c.endsWith('Gray'))
  .map((color) => ({ color, value: colors[color][500] }))
  .filter((c) => c.value)
  .filter((c) => !['slate', 'gray', 'zinc', 'stone'].includes(c.color))

withDefaults(
  defineProps<{
    contextMenu?: boolean
    anchor?: QMenu['anchor']
    self?: QMenu['self']
    offset?: QMenu['offset']
  }>(),
  {
    contextMenu: false,
    anchor: 'bottom right',
    self: 'top right'
  }
)

defineEmits<{
  'update:cardWidth': ['small' | 'medium' | 'large']
  'update:curveType': ['linear' | 'curve' | 'step-start' | 'step-end']
  'update:color': [string]
  delete: []
}>()
</script>

<template>
  <q-menu
    :anchor="anchor"
    :self="self"
    :context-menu="contextMenu"
    :offset="offset"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-list class="tw-min-w-[150px]">
      <q-item class="tw-text-secondary" clickable>
        <q-item-section>
          <span>
            <q-icon name="fa-solid fa-palette" class="tw-mr-2" />
            Graph Color
          </span>
        </q-item-section>
        <q-item-section side>
          <q-icon size="xs" name="fa-solid fa-chevron-right" />
        </q-item-section>

        <q-menu anchor="top end" self="top start">
          <q-list>
            <q-item
              v-for="n in graphColors"
              :key="n.value"
              class="tw-select-none tw-pr-12"
              dense
              clickable
              v-close-popup
              :style="{
                backgroundColor: n.value,
                color: $q.dark.isActive ? 'white' : 'black'
              }"
              @click="$emit('update:color', n.value)"
            >
              <q-item-section>{{ n.color }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>

      <q-item class="tw-text-secondary" clickable>
        <q-item-section>
          <span>
            <q-icon name="fa-solid fa-ruler-horizontal" class="tw-mr-2" />
            Card Width
          </span>
        </q-item-section>
        <q-item-section side>
          <q-icon size="xs" name="fa-solid fa-chevron-right" />
        </q-item-section>

        <q-menu anchor="top end" self="top start">
          <q-list>
            <q-item
              class="tw-select-none"
              dense
              clickable
              v-close-popup
              @click="$emit('update:cardWidth', 'small')"
            >
              <q-item-section>Small</q-item-section>
            </q-item>
            <q-item
              class="tw-select-none"
              dense
              clickable
              v-close-popup
              @click="$emit('update:cardWidth', 'medium')"
            >
              <q-item-section>Medium</q-item-section>
            </q-item>
            <q-item
              class="tw-select-none"
              dense
              clickable
              v-close-popup
              @click="$emit('update:cardWidth', 'large')"
            >
              <q-item-section>Large</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>

      <q-item class="tw-text-secondary" clickable>
        <q-item-section>
          <span>
            <q-icon name="fa-solid fa-chart-line" class="tw-mr-2" />
            Curve Type
          </span>
        </q-item-section>
        <q-item-section side>
          <q-icon size="xs" name="fa-solid fa-chevron-right" />
        </q-item-section>

        <q-menu anchor="top end" self="top start">
          <q-list>
            <q-item
              class="tw-select-none"
              dense
              clickable
              v-close-popup
              @click="$emit('update:curveType', 'linear')"
            >
              <q-item-section>Linear</q-item-section>
            </q-item>
            <q-item
              class="tw-select-none"
              dense
              clickable
              v-close-popup
              @click="$emit('update:curveType', 'curve')"
            >
              <q-item-section>Curve</q-item-section>
            </q-item>
            <q-item
              class="tw-select-none"
              dense
              clickable
              v-close-popup
              @click="$emit('update:curveType', 'step-start')"
            >
              <q-item-section>Step Start</q-item-section>
            </q-item>
            <q-item
              class="tw-select-none"
              dense
              clickable
              v-close-popup
              @click="$emit('update:curveType', 'step-end')"
            >
              <q-item-section>Step End</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>

      <q-item class="tw-text-red-500" clickable v-close-popup @click="$emit('delete')">
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
