import {
  BULL_SEGMENT,
  DARTS_PER_ROUND,
  MISS_SEGMENT,
  SCORE_TIER_THRESHOLDS,
  VALID_MULTIPLIERS,
} from '@/config'
import type { Dart, Player, RankedPlayer, Round, ScoreTier } from '@/types'

/**
 * Validates a dart throw against the game rules.
 * - Segment must be 0 (miss), 1-20, or 25 (bull).
 * - Multiplier must be 1, 2, or 3.
 * - Bull (25) cannot be tripled.
 * - A miss (0) must use a multiplier of 1 (there is nothing to multiply).
 */
export function isValidDart(dart: Dart): boolean {
  const { segment, multiplier } = dart
  if (!VALID_MULTIPLIERS.includes(multiplier)) return false
  if (segment === MISS_SEGMENT) return multiplier === 1
  if (segment === BULL_SEGMENT) return multiplier === 1 || multiplier === 2
  return Number.isInteger(segment) && segment >= 1 && segment <= 20
}

/**
 * Computes the score of a single dart. Invalid darts score 0 rather than
 * throwing, so corrupted/legacy data degrades gracefully instead of crashing
 * the app.
 */
export function dartScore(dart: Dart): number {
  if (!isValidDart(dart)) return 0
  return dart.segment * dart.multiplier
}

/** Sum of the darts in a round. */
export function roundScore(round: Round): number {
  return round.darts.reduce((sum, dart) => sum + dartScore(dart), 0)
}

/** Sum of all round scores for a player. */
export function total(player: Pick<Player, 'rounds'>): number {
  return player.rounds.reduce((sum, round) => sum + roundScore(round), 0)
}

/** The highest single round score a player has thrown, or 0 if none yet. */
export function bestRound(player: Pick<Player, 'rounds'>): number {
  return player.rounds.reduce((best, round) => Math.max(best, roundScore(round)), 0)
}

/** Count of double/triple hits across all of a player's darts (tie-break #2). */
export function bigHits(player: Pick<Player, 'rounds'>): number {
  let count = 0
  for (const round of player.rounds) {
    for (const dart of round.darts) {
      if (isValidDart(dart) && dart.segment !== MISS_SEGMENT && dart.multiplier > 1) count++
    }
  }
  return count
}

/** Number of rounds a player has thrown (out of the configured total). */
export function roundsCompleted(player: Pick<Player, 'rounds'>): number {
  return player.rounds.length
}

/** Whether a player has thrown the maximum number of rounds allowed. */
export function hasReachedRoundLimit(
  player: Pick<Player, 'rounds'>,
  roundsPerPlayer: number,
): boolean {
  return player.rounds.length >= roundsPerPlayer
}

/** Whether a round is "full" (has thrown all of its darts). */
export function isRoundComplete(round: Round): boolean {
  return round.darts.length >= DARTS_PER_ROUND
}

/**
 * Looks up the celebration tier (if any) earned by a single round score.
 * Returns `null` when the score doesn't meet even the lowest threshold.
 */
export function getScoreTier(score: number): ScoreTier | null {
  const match = SCORE_TIER_THRESHOLDS.find((t) => score >= t.minScore)
  return match?.tier ?? null
}

interface Standing {
  total: number
  bestRound: number
  bigHits: number
}

function compareStandings(a: Standing, b: Standing): number {
  if (b.total !== a.total) return b.total - a.total
  if (b.bestRound !== a.bestRound) return b.bestRound - a.bestRound
  return b.bigHits - a.bigHits
}

/**
 * Ranks players using "competition ranking" (1, 2, 2, 4): players tied on every
 * tie-break criterion share the same rank, and the next distinct player's rank
 * equals their position in the sorted list (1-based).
 *
 * Tie-break order: (1) higher total, (2) higher best round, (3) higher count
 * of doubles/triples, (4) shared rank if still tied.
 */
export function rankPlayers(players: Player[]): RankedPlayer[] {
  const withStats = players.map((player) => ({
    player,
    total: total(player),
    bestRound: bestRound(player),
    bigHits: bigHits(player),
    roundsCompleted: roundsCompleted(player),
  }))

  withStats.sort((a, b) => {
    const cmp = compareStandings(a, b)
    if (cmp !== 0) return cmp
    return a.player.name.localeCompare(b.player.name)
  })

  const ranked: RankedPlayer[] = []
  withStats.forEach((entry, index) => {
    const previous = withStats[index - 1]
    const tiedWithPrevious = previous !== undefined && compareStandings(previous, entry) === 0
    const rank = tiedWithPrevious ? (ranked[index - 1]?.rank ?? index + 1) : index + 1
    ranked.push({
      ...entry.player,
      total: entry.total,
      bestRound: entry.bestRound,
      bigHits: entry.bigHits,
      roundsCompleted: entry.roundsCompleted,
      rank,
    })
  })

  return ranked
}
