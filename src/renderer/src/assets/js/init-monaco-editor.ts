import * as monaco from 'monaco-editor'

monaco.editor.defineTheme('vs-lighter', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#f5f5f5'
  }
})

monaco.editor.defineTheme('vs-dark-darker', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#262626'
  }
})
