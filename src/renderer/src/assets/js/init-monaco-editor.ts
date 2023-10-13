import 'monaco-editor/esm/vs/editor/contrib/wordHighlighter/browser/wordHighlighter.js'
import 'monaco-editor/esm/vs/basic-languages/xml/xml'
import 'monaco-editor/esm/vs/editor/editor.all.js'

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

// monaco.languages.html.registerHTMLLanguageService('xml', {}, { documentFormattingEdits: true })
