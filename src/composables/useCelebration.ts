import { CELEBRATION_CHANNEL_NAME } from '@/config'
import type { ScoreTier } from '@/types'
import { useSync } from './useSync'

export interface CelebrationEvent {
  id: string
  tier: ScoreTier
  playerName: string
  roundScore: number
}

// A single module-level channel instance, shared by every component in this
// tab. BroadcastChannel delivers messages to every *other* channel instance
// with the same name (including ones in the same tab), so triggering a
// celebration from the operator panel reliably reaches the leaderboard view,
// whether they're in the same tab (split view) or a separate projected tab.
const channel = useSync<CelebrationEvent>(CELEBRATION_CHANNEL_NAME)

/** Broadcasts a celebration to this tab and every other open tab. */
export function triggerCelebration(event: Omit<CelebrationEvent, 'id'>) {
  const payload: CelebrationEvent = {
    ...event,
    id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  }
  channel.post(payload)
}

/** Subscribes to celebrations triggered anywhere (this tab or another one). */
export function onCelebration(handler: (event: CelebrationEvent) => void) {
  channel.onMessage(handler)
}
