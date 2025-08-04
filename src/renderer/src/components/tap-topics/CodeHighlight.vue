<script lang="ts" setup>
import { useHighlightTheme } from '@renderer/composables/useHighlightTheme'
import { formatCode } from '@renderer/assets/js/format-code'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import xml from 'highlight.js/lib/languages/xml'
import hljs from 'highlight.js/lib/core'
import { ref, watch } from 'vue'

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

watch(
  [() => props.code, () => props.language],
  () => {
    if (!props.language || props.language === 'raw') return

    const code = formatCode(props.code, props.language)

    highlighted.value = hljs.highlight(code, {
      language: props.language
    }).value
  },
  { immediate: true }
)
</script>

<template>
  <span v-if="language !== 'raw'" class="code-text" v-html="highlighted" />
  <span v-else class="code-text" v-text="code" />
</template>

<style scoped lang="less">
.code-text {
  @apply tw-ml-1 tw-overflow-x-hidden tw-overflow-ellipsis tw-text-xs;
}
</style>
