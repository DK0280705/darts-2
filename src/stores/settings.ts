import { defineStore } from 'pinia'
import { DEFAULT_COMPETITION_TITLE, DEFAULT_ROUNDS_PER_PLAYER } from '@/config'
import type { Settings } from '@/types'

export const useSettingsStore = defineStore('settings', {
  state: (): Settings => ({
    roundsPerPlayer: DEFAULT_ROUNDS_PER_PLAYER,
    competitionTitle: DEFAULT_COMPETITION_TITLE,
  }),
  actions: {
    setCompetitionTitle(title: string) {
      const trimmed = title.trim()
      this.competitionTitle = trimmed.length > 0 ? trimmed : DEFAULT_COMPETITION_TITLE
    },
    setRoundsPerPlayer(rounds: number) {
      if (!Number.isInteger(rounds) || rounds < 1) return
      this.roundsPerPlayer = rounds
    },
    /** Replaces the whole settings object, e.g. from an import or sync message. Validates shape defensively. */
    replaceAll(settings: Partial<Settings>) {
      if (typeof settings.competitionTitle === 'string' && settings.competitionTitle.trim()) {
        this.competitionTitle = settings.competitionTitle.trim()
      }
      if (typeof settings.roundsPerPlayer === 'number' && settings.roundsPerPlayer >= 1) {
        this.roundsPerPlayer = Math.floor(settings.roundsPerPlayer)
      }
    },
    resetToDefaults() {
      this.roundsPerPlayer = DEFAULT_ROUNDS_PER_PLAYER
      this.competitionTitle = DEFAULT_COMPETITION_TITLE
    },
  },
})
