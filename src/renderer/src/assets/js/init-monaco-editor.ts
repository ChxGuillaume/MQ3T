import 'monaco-editor/esm/vs/editor/contrib/wordHighlighter/browser/wordHighlighter.js'
import 'monaco-editor/esm/vs/editor/editor.all.js'

import { formatXml, formatYaml } from './format-code'
import * as monaco from 'monaco-editor'
import { IRange } from 'monaco-editor'

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

monaco.languages.registerDocumentFormattingEditProvider('xml', {
  async provideDocumentFormattingEdits(model) {
    return [{ range: model.getFullModelRange(), text: formatXml(model.getValue()) }]
  }
})

monaco.languages.registerDocumentFormattingEditProvider('yaml', {
  async provideDocumentFormattingEdits(model) {
    return [{ range: model.getFullModelRange(), text: formatYaml(model.getValue()) }]
  }
})

let jsonCompletionDisposable: monaco.IDisposable | null = null
let xmlCompletionDisposable: monaco.IDisposable | null = null
let yamlCompletionDisposable: monaco.IDisposable | null = null

export const unregisterCompletionProvider = () => {
  if (jsonCompletionDisposable) jsonCompletionDisposable.dispose()
  if (xmlCompletionDisposable) xmlCompletionDisposable.dispose()
  if (yamlCompletionDisposable) yamlCompletionDisposable.dispose()
}

export const registerCompletionProvider = () => {
  unregisterCompletionProvider()

  const jsonSuggestions = (range: IRange): monaco.languages.CompletionItem[] => [
    {
      label: '$s$',
      kind: monaco.languages.CompletionItemKind.Variable,
      detail: 'String Variable',
      documentation: 'Create a String Variable',
      insertText: '"\\$s\\$${1:my_string}\\$"',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range
    },
    {
      label: '$n$',
      kind: monaco.languages.CompletionItemKind.Variable,
      detail: 'Number Variable',
      documentation: 'Create a Number Variable',
      insertText: '"\\$n\\$${1:my_number}\\$"',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range
    },
    {
      label: '$b$',
      kind: monaco.languages.CompletionItemKind.Variable,
      detail: 'Boolean Variable',
      documentation: 'Create a Boolean Variable',
      insertText: '"\\$b\\$${1:my_boolean}\\$"',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range
    },
    {
      label: '$enum$',
      kind: monaco.languages.CompletionItemKind.Variable,
      detail: 'Enum Variable',
      documentation: 'Create a Enum Variable',
      insertText: '"\\$enum\\$${1:my_enum}\\$"',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range: range
    },
    {
      label: '$uuid$v4$',
      kind: monaco.languages.CompletionItemKind.Variable,
      detail: 'UUID V4',
      documentation: 'Create a UUID V4',
      insertText: '"$uuid$v4$"',
      range: range
    }
  ]

  jsonCompletionDisposable = monaco.languages.registerCompletionItemProvider('json', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      return { suggestions: jsonSuggestions(range) }
    }
  })

  const xmlSuggestions = (range: IRange): monaco.languages.CompletionItem[] => {
    const jsonItems = jsonSuggestions(range)
    return jsonItems.map((item) => {
      item.insertText = item.insertText.replace(/"/g, '')
      return item
    })
  }

  xmlCompletionDisposable = monaco.languages.registerCompletionItemProvider('xml', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      return { suggestions: xmlSuggestions(range) }
    }
  })

  const ymlSuggestions = (range: IRange): monaco.languages.CompletionItem[] => {
    const jsonItems = jsonSuggestions(range)
    return jsonItems.map((item) => {
      item.insertText = item.insertText.replace(/"/g, '')
      return item
    })
  }

  yamlCompletionDisposable = monaco.languages.registerCompletionItemProvider('yaml', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      }

      return { suggestions: ymlSuggestions(range) }
    }
  })
}
