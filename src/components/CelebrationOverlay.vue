<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { CELEBRATION_FALLBACK_TIMEOUT_MS, CELEBRATION_VIDEOS } from '@/config'
import type { ScoreTier } from '@/types'

const props = defineProps<{
  tier: ScoreTier
  playerName: string
  roundScore: number
}>()

const emit = defineEmits<{
  close: []
}>()

const tierLabels: Record<ScoreTier, string> = {
  S: 'S-Rank!',
  A: 'A-Rank!',
  B: 'B-Rank!',
  C: 'C-Rank!',
}

const videoFailed = ref(false)
const videoSrc = ref(CELEBRATION_VIDEOS[props.tier])

let fallbackTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFallbackClose() {
  clearFallbackClose()
  fallbackTimer = setTimeout(() => emit('close'), CELEBRATION_FALLBACK_TIMEOUT_MS)
}

function clearFallbackClose() {
  if (fallbackTimer !== null) {
    clearTimeout(fallbackTimer)
    fallbackTimer = null
  }
}

function onVideoError() {
  // The video file hasn't been added yet (or failed to load) — fall back to
  // a text/badge celebration instead of leaving a broken player on screen.
  videoFailed.value = true
}

function onVideoEnded() {
  emit('close')
}

watch(
  () => props.tier,
  (tier) => {
    videoFailed.value = false
    videoSrc.value = CELEBRATION_VIDEOS[tier]
    scheduleFallbackClose()
  },
  { immediate: true },
)

onBeforeUnmount(clearFallbackClose)
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <button
        type="button"
        class="absolute top-6 right-6 rounded-lg border border-wood-600 px-3 py-1.5 text-sm text-stone-300 hover:bg-wood-800"
        @click="emit('close')"
      >
        ✕ Close
      </button>

      <div class="flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <video
          v-if="!videoFailed"
          :key="videoSrc"
          class="max-h-[70vh] max-w-full rounded-xl shadow-2xl"
          autoplay
          playsinline
          :src="videoSrc"
          @playing="clearFallbackClose"
          @ended="onVideoEnded"
          @error="onVideoError"
        >
          Celebration video.
        </video>

        <div v-else class="rounded-2xl border border-gold-400/50 bg-wood-900/80 px-10 py-12">
          <p class="text-sm tracking-widest text-stone-500 uppercase">Celebration video coming soon</p>
          <p class="mt-2 text-xs text-stone-600">
            Drop a file at <code class="text-stone-400">{{ videoSrc }}</code> to play it here.
          </p>
        </div>

        <div>
          <p class="text-6xl font-black text-gold-300 drop-shadow sm:text-8xl">
            {{ tierLabels[tier] }}
          </p>
          <p class="mt-2 text-2xl font-bold text-stone-100 sm:text-3xl">{{ playerName }}</p>
          <p class="text-lg text-stone-400">scored {{ roundScore }} this round!</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
