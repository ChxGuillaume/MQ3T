import * as monaco from 'monaco-editor'

export const disableCommandPalette = (editor: monaco.editor.IStandaloneCodeEditor) => {
  editor.addCommand(monaco.KeyCode.F1, () => undefined)
}
