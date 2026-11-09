import ChainVariablesDialog from '@renderer/components/tab-actions/dialogs/ChainVariablesDialog.vue'
import { NamedVariableValues } from '@renderer/components/tab-actions/action-utils'
import { ChainRunGraph, chainVariableSource } from './chain-runner'
import { useOverlay } from '@nuxt/ui/composables'

export function useChainVariablesPrompt() {
  const overlay = useOverlay()

  const promptVariables = async (
    chainName: string,
    graph: ChainRunGraph
  ): Promise<NamedVariableValues | null> => {
    const { source, hasUuid } = chainVariableSource(graph)

    if (!source.payload) return {}

    return (
      (await overlay
        .create(ChainVariablesDialog, { destroyOnClose: true })
        .open({ chainName, source, hasUuid }).result) ?? null
    )
  }

  return { promptVariables }
}
