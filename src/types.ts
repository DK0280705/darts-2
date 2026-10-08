/** A single dart throw. */
export interface Dart {
  /** Segment hit: 0 (miss), 1-20, or 25 (bull). */
  segment: number
  /** Multiplier applied to the segment: 1 (single), 2 (double), 3 (triple). */
  multiplier: 1 | 2 | 3
}

/** One round of up to three darts. */
export interface Round {
  darts: Dart[]
}

/** A competitor in the competition. */
export interface Player {
  id: string
  name: string
  className?: string
  rounds: Round[]
}

/** Competition-wide configuration, persisted alongside player data. */
export interface Settings {
  roundsPerPlayer: number
  competitionTitle: string
}

/** A player enriched with computed standings data, used for display. */
export interface RankedPlayer extends Player {
  total: number
  bestRound: number
  roundsCompleted: number
  /** Count of double/triple hits, used as a tie-breaker. */
  bigHits: number
  rank: number
}

/** Shape of the JSON blob produced by "Export JSON" / consumed by "Import JSON". */
export interface ExportedData {
  version: 1
  players: Player[]
  settings: Settings
}

/** Celebration tiers awarded for an exceptionally high round score. */
export type ScoreTier = 'S' | 'A' | 'B' | 'C'
