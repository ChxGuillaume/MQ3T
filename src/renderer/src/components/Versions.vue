<script setup lang="ts">
import { reactive } from 'vue'

type Versions = {
  node: string
  acorn: string
  ada: string
  ares: string
  brotli: string
  cldr: string
  icu: string
  llhttp: string
  modules: string
  napi: string
  nghttp2: string
  openssl: string
  simdutf: string
  tz: string
  undici: string
  unicode: string
  uv: string
  uvwasi: string
  v8: string
  zlib: string
  electron: string
  chrome: string
}

const versions = reactive({ ...window.electron.process.versions } as Versions)
</script>

<template>
  <q-list class="versions">
    <q-item class="tw-flex tw-items-center">
      <q-icon name="fa-solid fa-atom" size="md" left color="indigo-8" />
      <q-item-section>
        <span>Electron</span>
        <span class="version-color">v{{ versions.electron }}</span>
      </q-item-section>
    </q-item>
    <q-item class="tw-flex tw-items-center">
      <q-icon name="fa-brands fa-chrome" size="md" left color="blue-7" />
      <q-item-section>
        <span>Chromium</span>
        <span class="version-color">v{{ versions.chrome }}</span>
      </q-item-section>
    </q-item>
    <q-item class="tw-flex tw-items-center">
      <q-icon name="fa-brands fa-node-js" size="md" left color="green" />
      <q-item-section>
        <span>Node</span>
        <span class="version-color">v{{ versions.node }}</span>
      </q-item-section>
    </q-item>
    <q-item class="tw-flex tw-items-center">
      <q-icon name="fa-brands fa-js" size="md" left color="yellow" />
      <q-item-section>
        <span>V8 Engine</span>
        <span class="version-color">v{{ versions.v8 }}</span>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<style scoped lang="less">
.body--dark .version-color {
  @apply tw-text-neutral-500;
}

.body--light .version-color {
  @apply tw-text-neutral-400;
}
</style>
