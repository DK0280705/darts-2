import { createRouter, createWebHashHistory } from 'vue-router'
import LeaderboardView from '@/views/LeaderboardView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'leaderboard',
      component: LeaderboardView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
  ],
})

export default router
