<script lang="ts" setup>
import { ref, watch, nextTick, computed, onMounted } from 'vue'
import { formatCode } from '@renderer/assets/js/format-code'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import xml from 'highlight.js/lib/languages/xml'
import hljs from 'highlight.js/lib/core'

const MAX_CODE_LENGTH = 8192
const MAX_RAW_CODE_LENGTH = 1024

hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)

type Props = {
  code: string
  language?: 'json' | 'xml' | 'yaml' | 'raw'
}

const props = defineProps<Props>()

const messageSize = computed(() => props.code.length)

const showFormatedCode = computed(
  () => props.language !== 'raw' && messageSize.value < MAX_CODE_LENGTH
)

const codeTextRef = ref<HTMLElement>()

const updateElementHighlight = () => {
  if (!props.language || props.language === 'raw') return

  const code = formatCode(props.code, props.language)

  if (codeTextRef.value) {
    codeTextRef.value.innerHTML = hljs.highlight(code, { language: props.language }).value
  }
}

watch(
  [() => props.code, () => props.language],
  () => {
    if (!props.language || props.language === 'raw') return

    updateElementHighlight()

    nextTick(() => {
      if (!codeTextRef.value) return

      codeTextRef.value.querySelectorAll('span.hljs-number').forEach((el) => {
        const text = el.textContent?.trim() ?? ''

        if (/^-?\d+(\.\d+)?$/.test(text)) {
          const num = parseFloat(text)
          el.textContent = num.toLocaleString(undefined, { maximumFractionDigits: 12 })
        }
      })
    })
  },
  { immediate: true }
)

onMounted(() => updateElementHighlight())

const getRawCode = () => {
  if (props.code.length > MAX_RAW_CODE_LENGTH) {
    return `${props.code.slice(0, MAX_RAW_CODE_LENGTH)}... (truncated)`
  } else return props.code
}
</script>

<template>
  <span v-if="showFormatedCode" ref="codeTextRef" class="code-text" />
  <span v-else class="code-text" v-text="getRawCode()" />
</template>

<style scoped lang="less">
.code-text {
  @apply tw-ml-1 tw-overflow-x-hidden tw-overflow-ellipsis tw-text-xs;
}
</style>
