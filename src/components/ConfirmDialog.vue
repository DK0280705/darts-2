<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
  }>(),
  { confirmLabel: 'Confirm', cancelLabel: 'Cancel', danger: false },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      @click.self="emit('cancel')"
    >
      <div
        class="w-full max-w-md rounded-2xl border border-white/15 bg-wood-950/90 p-6 shadow-2xl backdrop-blur-2xl"
      >
        <h2 class="mb-2 text-lg font-bold text-stone-100">{{ title }}</h2>
        <p class="mb-6 text-sm text-stone-300 leading-relaxed">{{ message }}</p>
        <div class="flex justify-end gap-2.5">
          <button
            type="button"
            class="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all"
            @click="emit('cancel')"
          >
            {{ cancelLabel }}
          </button>
          <button
            type="button"
            class="rounded-xl px-4 py-2 text-sm font-semibold active:scale-95 transition-all shadow-sm"
            :class="
              danger
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-amber-400 text-stone-950 hover:bg-amber-300'
            "
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
