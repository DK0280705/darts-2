<script setup lang="ts">
import { ref } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { usePlayersStore } from '@/stores/players'
import { useSettingsStore } from '@/stores/settings'
import { rankPlayers } from '@/domain/scoring'
import type { ExportedData } from '@/types'

const playersStore = usePlayersStore()
const settingsStore = useSettingsStore()

const titleDraft = ref(settingsStore.competitionTitle)
const roundsDraft = ref(settingsStore.roundsPerPlayer)

function saveTitle() {
  settingsStore.setCompetitionTitle(titleDraft.value)
  titleDraft.value = settingsStore.competitionTitle
}

function saveRounds() {
  settingsStore.setRoundsPerPlayer(Number(roundsDraft.value))
  roundsDraft.value = settingsStore.roundsPerPlayer
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function exportJson() {
  const data: ExportedData = {
    version: 1,
    players: playersStore.players,
    settings: {
      roundsPerPlayer: settingsStore.roundsPerPlayer,
      competitionTitle: settingsStore.competitionTitle,
    },
  }
  download('darts-scoreboard.json', JSON.stringify(data, null, 2), 'application/json')
}

function csvEscape(value: string | number): string {
  const str = String(value)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function exportCsv() {
  const ranked = rankPlayers(playersStore.players)
  const header = ['Rank', 'Name', 'Class', 'Rounds completed', 'Best round', 'Total']
  const rows = ranked.map((p) => [
    p.rank,
    p.name,
    p.className ?? '',
    `${p.roundsCompleted}/${settingsStore.roundsPerPlayer}`,
    p.bestRound,
    p.total,
  ])
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
  download('leaderboard.csv', csv, 'text/csv')
}

const importError = ref<string | null>(null)
const importSuccess = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function triggerImport() {
  importError.value = null
  importSuccess.value = null
  fileInput.value?.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const raw = reader.result
      if (typeof raw !== 'string') throw new Error('Unreadable file.')
      const data = JSON.parse(raw) as Partial<ExportedData>
      if (!data || typeof data !== 'object' || !Array.isArray(data.players)) {
        throw new Error('This file does not look like a Darts Scoreboard export.')
      }
      playersStore.replaceAll(data.players)
      if (data.settings) settingsStore.replaceAll(data.settings)
      titleDraft.value = settingsStore.competitionTitle
      roundsDraft.value = settingsStore.roundsPerPlayer
      importError.value = null
      importSuccess.value = `Imported ${playersStore.players.length} player(s).`
    } catch (err) {
      importError.value =
        err instanceof Error
          ? `Import failed: ${err.message}`
          : 'Import failed: the file could not be read as valid JSON.'
    }
  }
  reader.onerror = () => {
    importError.value = 'Import failed: could not read the file.'
  }
  reader.readAsText(file)
}

const showResetConfirm = ref(false)

function confirmReset() {
  playersStore.resetAll()
  settingsStore.resetToDefaults()
  titleDraft.value = settingsStore.competitionTitle
  roundsDraft.value = settingsStore.roundsPerPlayer
  showResetConfirm.value = false
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-6 sm:px-6">
    <h1 class="mb-6 text-3xl font-black text-gold-300">⚙ Settings</h1>

    <section class="mb-6 rounded-xl border border-wood-700 bg-wood-900/60 p-4">
      <h2 class="mb-3 text-sm font-semibold tracking-wide text-stone-400 uppercase">Competition</h2>

      <label class="mb-1 block text-sm text-stone-400">Competition title</label>
      <div class="mb-4 flex gap-2">
        <input
          v-model="titleDraft"
          type="text"
          class="min-w-0 flex-1 rounded-lg border border-wood-600 bg-wood-800 px-3 py-2 text-stone-100 focus:border-gold-400 focus:outline-none"
          @keyup.enter="saveTitle"
        />
        <button
          type="button"
          class="rounded-lg bg-gold-400 px-4 py-2 font-bold text-wood-950 hover:bg-gold-300"
          @click="saveTitle"
        >
          Save
        </button>
      </div>

      <label class="mb-1 block text-sm text-stone-400">Rounds per player</label>
      <div class="flex gap-2">
        <input
          v-model.number="roundsDraft"
          type="number"
          min="1"
          max="20"
          class="w-28 rounded-lg border border-wood-600 bg-wood-800 px-3 py-2 text-stone-100 focus:border-gold-400 focus:outline-none"
          @keyup.enter="saveRounds"
        />
        <button
          type="button"
          class="rounded-lg bg-gold-400 px-4 py-2 font-bold text-wood-950 hover:bg-gold-300"
          @click="saveRounds"
        >
          Save
        </button>
      </div>
      <p class="mt-2 text-xs text-stone-500">
        Lowering this does not delete already-recorded rounds; it only changes when entry is
        blocked.
      </p>
    </section>

    <section class="mb-6 rounded-xl border border-wood-700 bg-wood-900/60 p-4">
      <h2 class="mb-3 text-sm font-semibold tracking-wide text-stone-400 uppercase">Data</h2>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg bg-wood-700 px-4 py-2 font-semibold text-stone-100 hover:bg-wood-600"
          @click="exportJson"
        >
          Export JSON
        </button>
        <button
          type="button"
          class="rounded-lg bg-wood-700 px-4 py-2 font-semibold text-stone-100 hover:bg-wood-600"
          @click="exportCsv"
        >
          Export leaderboard CSV
        </button>
        <button
          type="button"
          class="rounded-lg bg-wood-700 px-4 py-2 font-semibold text-stone-100 hover:bg-wood-600"
          @click="triggerImport"
        >
          Import JSON
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json"
          class="hidden"
          @change="onFileSelected"
        />
      </div>
      <p v-if="importError" class="mt-2 text-sm text-red-300">{{ importError }}</p>
      <p v-if="importSuccess" class="mt-2 text-sm text-green-300">{{ importSuccess }}</p>
    </section>

    <section class="rounded-xl border border-red-900/60 bg-red-950/20 p-4">
      <h2 class="mb-3 text-sm font-semibold tracking-wide text-red-300 uppercase">Danger zone</h2>
      <button
        type="button"
        class="rounded-lg border border-red-800 px-4 py-2 font-semibold text-red-300 hover:bg-red-950/50"
        @click="showResetConfirm = true"
      >
        Reset all data
      </button>
    </section>

    <ConfirmDialog
      :open="showResetConfirm"
      title="Reset all data?"
      message="This permanently deletes every player, round, and setting. This cannot be undone."
      confirm-label="Reset"
      danger
      @confirm="confirmReset"
      @cancel="showResetConfirm = false"
    />
  </div>
</template>
