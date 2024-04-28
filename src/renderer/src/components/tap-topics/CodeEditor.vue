<script setup lang="ts">
import { validCode } from '../../assets/js/format-code'
import { computed, onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { useQuasar } from 'quasar'

export interface ICodeEditor {
  updateCodeEditorValue: (value: string) => void
}

const $q = useQuasar()

const props = defineProps<{
  modelValue: string
  fontSize?: number | string
  language?: 'raw' | 'json' | 'xml' | 'yaml' | string
}>()

const emits = defineEmits(['update:modelValue', 'update:language'])

const monacoEditorRef = ref(null)
let codeEditor: monaco.editor.IStandaloneCodeEditor | null = null

const updateCodeEditorValue = (value: string) => {
  if (!codeEditor) return

  codeEditor.setValue(value)
  emits('update:modelValue', value)
}

defineExpose({ updateCodeEditorValue })

watch(
  () => $q.dark.isActive,
  (isDark) => {
    if (!codeEditor) return

    if (isDark) {
      monaco.editor.setTheme('vs-dark-darker')
    } else {
      monaco.editor.setTheme('vs-lighter')
    }
  }
)

onMounted(() => {
  if (!monacoEditorRef.value) return

  codeEditor = monaco.editor.create(monacoEditorRef.value, {
    value: props.modelValue,
    language: props.language || 'raw',
    theme: $q.dark.isActive ? 'vs-dark-darker' : 'vs-lighter',
    overviewRulerLanes: 0,
    fontSize: parseInt(props.fontSize as string) || 12,
    lineNumbers: 'off',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6
    }
  })

  codeEditor.onDidChangeModelContent(() => {
    emits('update:modelValue', codeEditor!.getValue())
  })
})

watch(
  () => props.language,
  (newLanguage) => {
    if (!codeEditor) return

    monaco.editor.setModelLanguage(codeEditor.getModel()!, newLanguage || 'json')
  }
)

const editorLanguage = computed({
  get: () => props.language || 'raw',
  set: (value) => {
    emits('update:modelValue', codeEditor!.getValue())
    emits('update:language', value)

    monaco.editor.setModelLanguage(codeEditor!.getModel()!, value)
  }
})

const handleFormatCode = () => {
  codeEditor?.getAction('editor.action.formatDocument')?.run()
}

const valideCode = computed(() => {
  return validCode(props.modelValue, editorLanguage.value)
})
</script>

<template>
  <div class="editor">
    <div
      ref="monacoEditorRef"
      class="monaco-editor tw-w-full tw-flex-grow"
      :class="{ 'validation-error': !valideCode, raw: editorLanguage === 'raw' }"
    />
    <div class="options tw-p-3 tw-flex tw-justify-between">
      <q-btn-toggle
        v-model="editorLanguage"
        toggle-color="primary"
        unelevated
        dense
        padding="4px 12px"
        :options="[
          { label: 'Raw', value: 'raw' },
          { label: 'JSON', value: 'json' },
          { label: 'XML', value: 'xml' },
          { label: 'YAML', value: 'yaml' }
        ]"
      />
      <q-btn
        color="primary"
        dense
        padding="0px 12px"
        :disable="editorLanguage === 'raw'"
        @click="handleFormatCode"
      >
        <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-align-left" />
        Format
      </q-btn>
    </div>
  </div>
</template>

<style scoped lang="less">
.body--light {
  .monaco-editor.raw,
  .options {
    @apply tw-border-black/20;
  }
}

.body--dark {
  .monaco-editor.raw,
  .options {
    @apply tw-border-white/20;
  }
}

.options {
  @apply tw-border-t-2;
}

.editor {
  @apply tw-h-full tw-flex tw-flex-col-reverse;
}

.monaco-editor {
  @apply tw-w-full tw-border-y-2 tw-border-green-500/40 tw-overflow-auto tw-transition-colors tw-outline-0;
}

.monaco-editor.validation-error {
  @apply tw-border-red-500/40;
}
</style>
