<script setup lang="ts">
import GraphList from '../components/tap-topics/GraphList.vue'
import { ElectronApi } from '../assets/js/electron-api'
import { onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useDataGraphsStore } from '@renderer/store/data-graphs'

const $q = useQuasar()

const dataGraphStore = useDataGraphsStore()

watch(
  () => $q.dark.isActive,
  (value) => {
    const classDark = 'dark'

    if (value) document.documentElement.classList.add(classDark)
    else document.documentElement.classList.remove(classDark)
  }
)

const values = ref<any[]>([])

onMounted(() => {
  const storedTheme = localStorage.getItem('darkMode')

  switch (storedTheme) {
    case 'true':
      $q.dark.set(true)
      break
    case 'false':
      $q.dark.set(false)
      break
    default:
      $q.dark.set('auto')
      break
  }

  ElectronApi.handleGraphData((_, value) => {
    console.log('graph data', value)

    if (value.event === 'add-data-graph') {
      dataGraphStore.setDataGraphs(value.data)
    } else {
      values.value.push(value)
    }
  })
})
</script>

<template>
  <div class="tw-flex tw-h-full tw-flex-col tw-content-between">
    <div class="tw-flex-grow">
      {{ values }}
    </div>
    <graph-list />
  </div>
</template>

<style lang="less"></style>
