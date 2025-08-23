<script lang="ts" setup>
import { useHighlightTheme } from '@renderer/composables/useHighlightTheme'
import { formatCode } from '@renderer/assets/js/format-code'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import xml from 'highlight.js/lib/languages/xml'
import { ref, watch, nextTick } from 'vue'
import hljs from 'highlight.js/lib/core'

hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)

type Props = {
  code: string
  language?: 'json' | 'xml' | 'yaml' | 'raw'
}

const props = defineProps<Props>()

useHighlightTheme()

const highlighted = ref('')
const codeTextRef = ref<HTMLElement>()

watch(
  [() => props.code, () => props.language],
  () => {
    if (!props.language || props.language === 'raw') return

    const code = formatCode(props.code, props.language)

    highlighted.value = hljs.highlight(code, {
      language: props.language
    }).value

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
</script>

<template>
  <span v-if="language !== 'raw'" ref="codeTextRef" class="code-text" v-html="highlighted" />
  <span v-else class="code-text" v-text="code" />
</template>

<style scoped lang="less">
.code-text {
  @apply tw-ml-1 tw-overflow-x-hidden tw-overflow-ellipsis tw-text-xs;
}
</style>
