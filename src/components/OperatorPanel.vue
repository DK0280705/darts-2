<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DartKeypad from '@/components/DartKeypad.vue'
import RoundEditor from '@/components/RoundEditor.vue'
import PlayerSelect from '@/components/PlayerSelect.vue'
import PlayerSearch from '@/components/PlayerSearch.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { usePlayersStore } from '@/stores/players'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { getScoreTier, hasReachedRoundLimit, roundScore } from '@/domain/scoring'
import { triggerCelebration } from '@/composables/useCelebration'
import type { Dart } from '@/types'

const playersStore = usePlayersStore()
const settingsStore = useSettingsStore()
const uiStore = useUiStore()

const currentPlayer = computed(() => playersStore.currentPlayer)
const roundsPerPlayer = computed(() => settingsStore.roundsPerPlayer)

const currentDarts = ref<Dart[]>([])
const editingRoundIndex = ref<number | null>(null)
const errorMessage = ref<string | null>(null)
const showUndoConfirm = ref(false)

const isEditing = computed(() => editingRoundIndex.value !== null)
const atRoundLimit = computed(
  () => !!currentPlayer.value && hasReachedRoundLimit(currentPlayer.value, roundsPerPlayer.value),
)
const entryBlocked = computed(() => atRoundLimit.value && !isEditing.value)
const keypadDisabled = computed(
  () => !currentPlayer.value || entryBlocked.value || currentDarts.value.length >= 3,
)

function resetDraft() {
  currentDarts.value = []
  editingRoundIndex.value = null
  errorMessage.value = null
}

function addDart(dart: Dart) {
  if (currentDarts.value.length >= 3) return
  currentDarts.value.push(dart)
  errorMessage.value = null
}

function removeDart(index: number) {
  currentDarts.value.splice(index, 1)
}

function submit() {
  const player = currentPlayer.value
  if (!player) return
  const wasEditing = isEditing.value
  const thrownScore = roundScore({ darts: currentDarts.value })
  const result = wasEditing
    ? playersStore.updateRound(player.id, editingRoundIndex.value as number, currentDarts.value)
    : playersStore.submitRound(player.id, currentDarts.value, roundsPerPlayer.value)
  if (result.ok) {
    // Only celebrate brand-new rounds, not corrections to past ones.
    if (!wasEditing) {
      const tier = getScoreTier(thrownScore)
      if (tier) triggerCelebration({ tier, playerName: player.name, roundScore: thrownScore })
    }
    resetDraft()
  } else {
    errorMessage.value = result.error ?? 'Could not submit round.'
  }
}

function cancelEdit() {
  resetDraft()
}

function editRound(index: number) {
  const player = currentPlayer.value
  if (!player?.rounds[index]) return
  currentDarts.value = player.rounds[index].darts.map((d) => ({ ...d }))
  editingRoundIndex.value = index
  errorMessage.value = null
}

function confirmUndo() {
  const player = currentPlayer.value
  if (!player) return
  const result = playersStore.undoLastRound(player.id)
  if (
    result.ok &&
    editingRoundIndex.value !== null &&
    editingRoundIndex.value >= player.rounds.length
  ) {
    resetDraft()
  } else if (!result.ok) {
    errorMessage.value = result.error ?? 'Nothing to undo.'
  }
  showUndoConfirm.value = false
}

function selectPlayer(id: string) {
  playersStore.selectPlayer(id)
  resetDraft()
}

watch(
  () => playersStore.currentPlayerId,
  () => resetDraft(),
)

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return
  if (!currentPlayer.value || currentDarts.value.length === 0) return
  if (entryBlocked.value) return
  event.preventDefault()
  submit()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Empty State -->
    <div
      v-if="playersStore.players.length === 0"
      class="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
    >
      <p class="mb-4 text-base text-stone-300">No players yet.</p>
      <button
        type="button"
        class="rounded-xl bg-amber-400 px-5 py-2.5 font-semibold text-stone-950 hover:bg-amber-300 active:scale-95 transition-all shadow-sm"
        @click="uiStore.setTab('players')"
      >
        Add players
      </button>
    </div>

    <template v-else>
      <!-- Player Selection Section -->
      <section
        class="relative z-30 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
      >
        <label
          class="mb-2 block text-xs font-semibold tracking-wider text-stone-400 uppercase select-none"
        >
          Find player
        </label>
        <PlayerSearch :players="playersStore.players" @select="selectPlayer" />

        <label
          class="mt-4 mb-2 block text-xs font-semibold tracking-wider text-stone-400 uppercase select-none"
        >
          Current player
        </label>
        <div class="flex-1 min-w-0 h-11">
          <PlayerSelect
            :players="playersStore.players"
            :model-value="playersStore.currentPlayerId"
            @update:model-value="selectPlayer"
          />
        </div>
      </section>

      <!-- Keypad & Draft Editor Section -->
      <section v-if="currentPlayer" class="flex flex-col gap-4">
        <DartKeypad :disabled="keypadDisabled" @dart="addDart" />

        <div class="flex flex-col gap-4">
          <RoundEditor
            :darts="currentDarts"
            :disabled="entryBlocked"
            :submit-label="isEditing ? 'Save correction' : 'Submit round'"
            @remove="removeDart"
            @submit="submit"
            @cancel="cancelEdit"
          />

          <p
            v-if="errorMessage"
            class="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2 text-xs sm:text-sm text-red-300"
          >
            {{ errorMessage }}
          </p>
          <p
            v-if="entryBlocked"
            class="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-xs sm:text-sm text-amber-300"
          >
            All {{ roundsPerPlayer }} rounds have been thrown. Click a round below to correct it.
          </p>

          <button
            type="button"
            class="rounded-xl border border-white/10 bg-white/[0.05] py-2.5 text-xs sm:text-sm font-semibold text-stone-300 hover:bg-white/[0.1] hover:text-white active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentPlayer.rounds.length === 0"
            @click="showUndoConfirm = true"
          >
            ↶ Undo last round
          </button>
        </div>
      </section>

      <!-- Rounds History Section -->
      <section
        v-if="currentPlayer"
        class="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
      >
        <h2 class="mb-3 text-xs font-semibold tracking-wider text-stone-400 uppercase select-none">
          Rounds so far (click to correct)
        </h2>
        <p v-if="currentPlayer.rounds.length === 0" class="py-2 text-center text-xs text-stone-500">
          No rounds thrown yet.
        </p>
        <ul v-else class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <li v-for="(round, index) in currentPlayer.rounds" :key="index">
            <button
              type="button"
              class="w-full rounded-xl border p-2.5 text-left transition-all duration-150 active:scale-95"
              :class="
                editingRoundIndex === index
                  ? 'border-amber-400/80 bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/50 shadow-sm'
                  : 'border-white/10 bg-white/[0.04] text-stone-300 hover:border-white/20 hover:bg-white/[0.08]'
              "
              @click="editRound(index)"
            >
              <span class="block text-[11px] font-medium text-stone-400"
                >Round {{ index + 1 }}</span
              >
              <span class="text-base sm:text-lg font-bold tabular-nums">{{
                roundScore(round)
              }}</span>
            </button>
          </li>
        </ul>
      </section>
    </template>

    <ConfirmDialog
      :open="showUndoConfirm"
      title="Undo last round?"
      message="This removes the most recently submitted round for this player. This cannot be undone."
      confirm-label="Undo"
      danger
      @confirm="confirmUndo"
      @cancel="showUndoConfirm = false"
    />
  </div>
</template>
