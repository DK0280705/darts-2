<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PLAYER_SEARCH_RESULT_LIMIT } from '@/config'
import type { Player } from '@/types'

const props = withDefaults(
  defineProps<{
    players: Player[]
    placeholder?: string
  }>(),
  { placeholder: 'Search player name…' },
)

const emit = defineEmits<{
  select: [id: string]
}>()

const query = ref('')
const isOpen = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const dropdownStyle = ref({
  top: '0px',
  left: '0px',
  width: '0px',
})

function updatePosition() {
  if (!inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    top: `${rect.bottom + 6}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return props.players
    .filter((p) => p.name.toLowerCase().includes(q) || p.className?.toLowerCase().includes(q))
    .slice(0, PLAYER_SEARCH_RESULT_LIMIT)
})

const showNoMatches = computed(
  () => isOpen.value && query.value.trim() !== '' && results.value.length === 0,
)

function onFocus() {
  updatePosition()
  isOpen.value = true
}

watch([query, isOpen], () => {
  if (isOpen.value) {
    nextTick(updatePosition)
  }
})

function selectPlayer(player: Player) {
  emit('select', player.id)
  query.value = ''
  isOpen.value = false
}

function onBlur() {
  // Delay closing so a click on a result registers before the dropdown hides.
  setTimeout(() => {
    isOpen.value = false
  }, 150)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', updatePosition, true)
  window.addEventListener('resize', updatePosition)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <div class="relative">
    <span
      class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500 text-xs"
    >
      🔍
    </span>
    <input
      ref="inputRef"
      v-model="query"
      type="search"
      :placeholder="placeholder"
      class="w-full h-11 rounded-xl border border-white/10 bg-white/[0.05] pl-8 pr-3 py-2 text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-400/80 transition-all"
      @focus="onFocus"
      @input="updatePosition"
      @blur="onBlur"
    />
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out origin-top"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-100 ease-in origin-top"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="isOpen && results.length > 0"
          ref="dropdownRef"
          :style="dropdownStyle"
          class="fixed z-50 overflow-hidden rounded-2xl border border-white/20 bg-wood-950/80 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-3xl ring-1 ring-white/10 focus:outline-none"
        >
          <ul class="max-h-60 overflow-y-auto p-1.5 overscroll-contain">
            <li v-for="player in results" :key="player.id">
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs sm:text-sm text-stone-100 hover:bg-white/[0.08] transition-colors"
                @mousedown.prevent="selectPlayer(player)"
              >
                <span class="font-semibold">{{ player.name }}</span>
                <span
                  v-if="player.className"
                  class="rounded-md bg-white/[0.06] border border-white/10 px-1.5 py-0.5 text-[11px] font-medium text-stone-400"
                >
                  {{ player.className }}
                </span>
              </button>
            </li>
          </ul>
        </div>
        <p
          v-else-if="showNoMatches"
          :style="dropdownStyle"
          class="fixed z-50 rounded-2xl border border-white/20 bg-wood-950/80 backdrop-blur-3xl px-3.5 py-2.5 text-xs text-stone-400 shadow-[0_20px_50px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
        >
          No matching players.
        </p>
      </Transition>
    </Teleport>
  </div>
</template>
