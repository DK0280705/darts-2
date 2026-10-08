<script setup lang="ts">
import { ref } from 'vue'
import type { Dart } from '@/types'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{
  dart: [dart: Dart]
}>()

const modifier = ref<1 | 2 | 3>(1)

const numbers = Array.from({ length: 20 }, (_, i) => i + 1)

const modifierLabels: Record<1 | 2 | 3, string> = {
  1: 'Single',
  2: 'Double',
  3: 'Triple',
}

function selectModifier(m: 1 | 2 | 3) {
  modifier.value = m
}

function throwNumber(segment: number) {
  if (props.disabled) return
  emit('dart', { segment, multiplier: modifier.value })
  modifier.value = 1
}

function throwBull(multiplier: 1 | 2) {
  if (props.disabled) return
  emit('dart', { segment: 25, multiplier })
  modifier.value = 1
}

function throwMiss() {
  if (props.disabled) return
  emit('dart', { segment: 0, multiplier: 1 })
  modifier.value = 1
}
</script>

<template>
  <div class="dart-keypad select-none" :class="{ 'pointer-events-none opacity-40': disabled }">
    <!-- Segmented control for modifiers -->
    <div
      class="mb-3 flex gap-1 rounded-xl bg-white/[0.06] p-1 border border-white/[0.08] shadow-inner"
    >
      <button
        v-for="m in [1, 2, 3] as const"
        :key="m"
        type="button"
        class="flex-1 rounded-lg py-2 text-sm sm:text-base font-bold transition-all duration-150"
        :class="
          modifier === m
            ? 'bg-amber-400 text-stone-950 shadow-sm ring-1 ring-amber-300/40'
            : 'text-stone-300 hover:text-white hover:bg-white/[0.06]'
        "
        @click="selectModifier(m)"
      >
        {{ modifierLabels[m] }}
      </button>
    </div>

    <!-- Number keys -->
    <div class="grid grid-cols-5 m-1 gap-1.5 sm:grid-cols-10">
      <button
        v-for="n in numbers"
        :key="n"
        type="button"
        class="aspect-square rounded-xl bg-white/[0.05] border border-white/10 text-base sm:text-lg font-bold text-stone-100 hover:bg-white/[0.12] active:scale-95 active:bg-amber-400/30 transition-all shadow-sm"
        @click="throwNumber(n)"
      >
        {{ n }}
      </button>
    </div>

    <!-- Bull & Miss action keys -->
    <div class="mt-3 grid grid-cols-3 gap-2">
      <button
        type="button"
        class="rounded-xl border border-emerald-500/30 bg-emerald-950/40 py-2.5 text-sm sm:text-base font-bold text-emerald-200 hover:bg-emerald-900/50 hover:text-emerald-100 active:scale-95 transition-all shadow-sm"
        @click="throwBull(1)"
      >
        Bull (25)
      </button>
      <button
        type="button"
        class="rounded-xl border border-emerald-500/40 bg-emerald-900/50 py-2.5 text-sm sm:text-base font-bold text-emerald-100 hover:bg-emerald-800/60 active:scale-95 transition-all shadow-sm"
        @click="throwBull(2)"
      >
        Bull D (50)
      </button>
      <button
        type="button"
        class="rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-sm sm:text-base font-bold text-stone-400 hover:bg-white/[0.08] hover:text-stone-200 active:scale-95 transition-all shadow-sm"
        @click="throwMiss"
      >
        Miss
      </button>
    </div>
  </div>
</template>
