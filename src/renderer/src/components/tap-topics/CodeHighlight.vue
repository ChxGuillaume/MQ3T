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
  block?: boolean
}

const props = defineProps<Props>()

const messageSize = computed(() => props.code.length)

const showFormatedCode = computed(
  () => !!props.language && props.language !== 'raw' && messageSize.value < MAX_CODE_LENGTH
)

const codeTextRef = ref<HTMLElement>()

const updateElementHighlight = () => {
  if (!props.language || props.language === 'raw') return

  const code = props.block ? formatCode(props.code, props.language) : props.code

  if (codeTextRef.value) {
    codeTextRef.value.innerHTML = hljs.highlight(code, { language: props.language }).value
  }
}

watch(
  [() => props.code, () => props.language],
  () => {
    if (!showFormatedCode.value) return

    nextTick(() => {
      updateElementHighlight()

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

const rawCode = computed(() => {
  if (props.code.length > MAX_RAW_CODE_LENGTH) {
    return `${props.code.slice(0, MAX_RAW_CODE_LENGTH)}… (truncated)`
  }

  return props.code
})

const tokenClasses =
  '[&_.hljs-attr]:text-code-key [&_.hljs-name]:text-code-key [&_.hljs-string]:text-code-str [&_.hljs-number]:text-code-num [&_.hljs-literal]:text-code-sym [&_.hljs-keyword]:text-code-sym [&_.hljs-punctuation]:text-default'
</script>

<template>
  <component
    :is="block ? 'pre' : 'span'"
    v-if="showFormatedCode"
    ref="codeTextRef"
    class="font-mono"
    :class="[tokenClasses, block ? 'break-all whitespace-pre-wrap' : 'truncate']"
  />
  <component
    :is="block ? 'pre' : 'span'"
    v-else
    class="font-mono"
    :class="block ? 'break-all whitespace-pre-wrap' : 'truncate'"
  >
    {{ rawCode }}
  </component>
</template>
