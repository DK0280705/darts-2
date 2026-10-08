/**
 * Thin wrapper around BroadcastChannel for cross-tab messaging. Returns a
 * no-op channel when BroadcastChannel isn't available so callers don't need
 * to guard every call.
 */
export interface SyncChannel<T> {
  post: (data: T) => void
  onMessage: (handler: (data: T) => void) => void
  close: () => void
}

export function useSync<T>(channelName: string): SyncChannel<T> {
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null
  let handler: ((data: T) => void) | null = null

  channel?.addEventListener('message', (event: MessageEvent<T>) => {
    handler?.(event.data)
  })

  return {
    post(data: T) {
      channel?.postMessage(data)
    },
    onMessage(fn: (data: T) => void) {
      handler = fn
    },
    close() {
      channel?.close()
    },
  }
}
