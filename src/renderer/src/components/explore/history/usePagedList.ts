import { useSettingsStore } from '@renderer/store/settings-store'
import { computed, MaybeRefOrGetter, ref, toValue, watch } from 'vue'

export function usePagedList<T>(
  items: MaybeRefOrGetter<T[]>,
  pageSize: number,
  resetOn?: MaybeRefOrGetter<unknown>
) {
  const settingsStore = useSettingsStore()

  const page = ref(1)

  const paginated = computed(() => settingsStore.messagesPagination)

  const pages = computed(() =>
    paginated.value ? Math.max(1, Math.ceil(toValue(items).length / pageSize)) : 1
  )

  const pageItems = computed(() => {
    const list = toValue(items)

    if (!paginated.value) return list

    const start = (page.value - 1) * pageSize

    return list.slice(start, start + pageSize)
  })

  watch(pages, (count) => {
    if (page.value > count) page.value = count
  })

  if (resetOn !== undefined)
    watch(
      () => toValue(resetOn),
      () => (page.value = 1)
    )

  return { page, pages, pageItems, paginated }
}
