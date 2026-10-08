import { onUnmounted, ref, watch } from 'vue'
import { useSync } from './useSync'

export interface PersistOptions<T> {
  /** localStorage key this slice of state is saved under. */
  storageKey: string
  /** BroadcastChannel name used to push live updates to other tabs. */
  channelName: string
  /** Returns a serializable snapshot of the current store state. */
  getSnapshot: () => T
  /** Applies an incoming (local or remote) snapshot back into the store. Should validate defensively. */
  applySnapshot: (data: T) => void
  /** Whether to deep-watch the snapshot for nested mutations (e.g. arrays of objects). Defaults to true. */
  deep?: boolean
}

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Persists a store's state to localStorage and keeps it in sync with other
 * tabs/windows via BroadcastChannel (and the native `storage` event as a
 * fallback). Corrupt localStorage contents or sync messages are ignored
 * rather than thrown, so the app keeps working with whatever state it has.
 */
export function usePersist<T>(options: PersistOptions<T>) {
  const { storageKey, channelName, getSnapshot, applySnapshot, deep = true } = options
  const error = ref<string | null>(null)
  const channel = useSync<T>(channelName)

  // 1. Load any previously saved state for this browser.
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw !== null) {
      const data = safeParse<T>(raw)
      if (data !== null) {
        applySnapshot(data)
      } else {
        error.value = 'Saved data was corrupted, so this section was reset.'
      }
    }
  } catch {
    error.value = 'Could not read saved data from this browser.'
  }

  // Guards against re-broadcasting a snapshot we just received from elsewhere.
  let applyingRemote = false

  function persist() {
    if (applyingRemote) return
    try {
      // Round-trip through JSON so we broadcast a plain, structured-clone-safe
      // object rather than a reactive Proxy (which BroadcastChannel can reject).
      const json = JSON.stringify(getSnapshot())
      localStorage.setItem(storageKey, json)
      channel.post(JSON.parse(json))
    } catch {
      error.value = 'Could not save data in this browser (storage may be full or disabled).'
    }
  }

  function handleIncoming(data: T) {
    applyingRemote = true
    try {
      applySnapshot(data)
    } finally {
      applyingRemote = false
    }
  }

  // 2. Watch for local changes and persist + broadcast them. `flush: 'sync'`
  // keeps `applyingRemote` accurate for the duration of an applySnapshot call.
  watch(getSnapshot, persist, { deep, flush: 'sync' })

  // 3. Listen for changes from other tabs.
  channel.onMessage((data) => handleIncoming(data))

  function handleStorage(event: StorageEvent) {
    if (event.key !== storageKey || event.newValue === null) return
    const data = safeParse<T>(event.newValue)
    if (data !== null) handleIncoming(data)
  }
  window.addEventListener('storage', handleStorage)

  onUnmounted(() => {
    channel.close()
    window.removeEventListener('storage', handleStorage)
  })

  return { error }
}
