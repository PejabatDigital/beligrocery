import { createLocalStore } from './local'

export type { Snapshot, Store } from './types'

export const store = createLocalStore()

/** Ask the browser not to clear our data when space runs low. Best effort: some browsers decide for themselves. */
export function requestPersistentStorage() {
  navigator.storage?.persist?.().catch(() => {})
}
