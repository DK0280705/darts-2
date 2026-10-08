<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Player } from '@/types'

const props = defineProps<{
  players: Player[]
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const popoverStyle = ref({
  top: '0px',
  left: '0px',
  width: '0px',
})

const selectedPlayer = computed(() => props.players.find((p) => p.id === props.modelValue) ?? null)

function updatePosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  popoverStyle.value = {
    top: `${rect.bottom + 6}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

function toggle() {
  if (props.players.length === 0) return
  if (!isOpen.value) {
    updatePosition()
    isOpen.value = true
    nextTick(updatePosition)
  } else {
    isOpen.value = false
  }
}

function select(player: Player) {
  emit('update:modelValue', player.id)
  isOpen.value = false
}

function close() {
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (
    triggerRef.value &&
    !triggerRef.value.contains(target) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(target)
  ) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', updatePosition, true)
  window.addEventListener('resize', updatePosition)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <div class="relative h-full w-full">
    <!-- Apple HIG Pop-Up Button trigger -->
    <button
      ref="triggerRef"
      type="button"
      class="flex h-full w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-left text-sm sm:text-base font-semibold text-stone-100 shadow-sm backdrop-blur-md transition-all select-none hover:bg-white/[0.09] hover:border-white/20 active:scale-[0.99] focus:outline-none focus:border-amber-400/80 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="players.length === 0"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <template v-if="selectedPlayer">
          <span class="truncate font-semibold text-stone-100">{{ selectedPlayer.name }}</span>
          <span
            v-if="selectedPlayer.className"
            class="shrink-0 rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-stone-400"
          >
            {{ selectedPlayer.className }}
          </span>
        </template>
        <span v-else class="text-stone-400 font-normal">
          {{ players.length === 0 ? 'No players yet' : 'Select player…' }}
        </span>
      </div>

      <!-- Apple double-chevron pop-up indicator -->
      <span class="flex shrink-0 flex-col items-center justify-center text-stone-400 leading-none">
        <svg
          class="h-3.5 w-3.5 transition-transform duration-200"
          :class="{ 'text-amber-300': isOpen }"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m5 6 3-3 3 3" />
          <path d="m5 10 3 3 3-3" />
        </svg>
      </span>
    </button>

    <!-- Apple HIG Contextual Menu / Popover Panel (Teleported to body for true backdrop blur & proper z-index stacking over RoundEditor/Keypad) -->
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
          v-if="isOpen && players.length > 0"
          ref="dropdownRef"
          :style="popoverStyle"
          class="fixed z-50 overflow-hidden rounded-2xl border border-white/20 bg-wood-950/75 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-3xl ring-1 ring-white/10 focus:outline-none"
          role="listbox"
          tabindex="-1"
        >
          <div class="max-h-64 overflow-y-auto p-1.5 overscroll-contain">
            <div
              v-for="player in players"
              :key="player.id"
              role="option"
              :aria-selected="player.id === modelValue"
              class="group flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm transition-colors duration-100 select-none"
              :class="
                player.id === modelValue
                  ? 'bg-amber-400/20 text-amber-200 font-semibold'
                  : 'text-stone-200 hover:bg-white/[0.08] hover:text-white'
              "
              @click="select(player)"
            >
              <div class="flex min-w-0 flex-1 items-center gap-2">
                <span class="truncate">{{ player.name }}</span>
                <span
                  v-if="player.className"
                  class="shrink-0 rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-stone-400"
                >
                  {{ player.className }}
                </span>
              </div>

              <!-- Apple checkmark icon for active item -->
              <span
                v-if="player.id === modelValue"
                class="flex shrink-0 items-center justify-center text-amber-400"
                aria-hidden="true"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
