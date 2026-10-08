import { defineStore } from 'pinia'

export type ControlPanelTab = 'operator' | 'players'

/**
 * Transient, per-tab UI state for the sliding Operator/Players control panel.
 * Deliberately not persisted or cross-tab synced: each browser tab (e.g. the
 * projected leaderboard vs. the operator's laptop) keeps its own panel state.
 */
export const useUiStore = defineStore('ui', {
  state: () => ({
    panelOpen: false,
    panelTab: 'operator' as ControlPanelTab,
  }),
  actions: {
    openPanel(tab?: ControlPanelTab) {
      if (tab) this.panelTab = tab
      this.panelOpen = true
    },
    closePanel() {
      this.panelOpen = false
    },
    togglePanel() {
      this.panelOpen = !this.panelOpen
    },
    setTab(tab: ControlPanelTab) {
      this.panelTab = tab
    },
  },
})
