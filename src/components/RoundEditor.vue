<script setup lang="ts">
import { computed } from 'vue'
import { DARTS_PER_ROUND } from '@/config'
import { dartScore, roundScore } from '@/domain/scoring'
import type { Dart } from '@/types'

const props = withDefaults(
  defineProps<{
    darts: Dart[]
    submitLabel?: string
    disabled?: boolean
  }>(),
  { submitLabel: 'Submit round', disabled: false },
)

const emit = defineEmits<{
  remove: [index: number]
  submit: []
  cancel: []
}>()

const total = computed(() => roundScore({ darts: props.darts }))
const canSubmit = computed(() => !props.disabled && props.darts.length > 0)

function dartLabel(dart: Dart): string {
  if (dart.segment === 0) return 'Miss'
  if (dart.segment === 25) return dart.multiplier === 2 ? 'Bull D' : 'Bull'
  const prefix = dart.multiplier === 1 ? '' : dart.multiplier === 2 ? 'D' : 'T'
  return `${prefix}${dart.segment}`
}
</script>

<template>
  <div
    class="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
  >
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-xs font-semibold tracking-wider text-stone-400 uppercase select-none">
        Current round
      </h3>
      <span
        class="text-2xl font-black text-amber-300 tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
      >
        {{ total }}
      </span>
    </div>

    <div class="mb-4 flex gap-2">
      <div
        v-for="i in DARTS_PER_ROUND"
        :key="i"
        class="flex h-14 sm:h-16 flex-1 items-center justify-center rounded-xl border border-dashed text-base sm:text-lg font-bold transition-all"
        :class="
          darts[i - 1]
            ? 'border-amber-400/80 bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30 shadow-sm'
            : 'border-white/15 bg-white/[0.02] text-stone-600'
        "
      >
        <button
          v-if="darts[i - 1]"
          type="button"
          class="flex h-full w-full items-center justify-center gap-1 active:scale-95 transition-transform"
          :title="`Remove dart ${i} (${dartLabel(darts[i - 1]!)} = ${dartScore(darts[i - 1]!)})`"
          @click="emit('remove', i - 1)"
        >
          <span>{{ dartLabel(darts[i - 1]!) }}</span>
          <span class="text-xs text-stone-400">✕</span>
        </button>
        <span v-else class="text-sm text-stone-600 font-medium">{{ i }}</span>
      </div>
    </div>

    <div class="flex gap-2">
      <button
        v-if="disabled === false"
        type="button"
        class="flex-1 rounded-xl bg-amber-400 py-3 text-sm sm:text-base font-bold text-stone-950 transition-all hover:bg-amber-300 active:scale-95 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!canSubmit"
        @click="emit('submit')"
      >
        {{ submitLabel }}
      </button>
      <button
        v-if="submitLabel !== 'Submit round'"
        type="button"
        class="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-stone-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all"
        @click="emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>
