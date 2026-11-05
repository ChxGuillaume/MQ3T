import { createSharedComposable, useIntervalFn, useNow } from '@vueuse/core'

export const useSharedNow = createSharedComposable(() =>
  useNow({ scheduler: (cb) => useIntervalFn(cb, 1000) })
)
