import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'draft',
      component: () => import('../pages/MainPage.vue'),
    },
    {
      path: '/heroes',
      name: 'heroes',
      component: () => import('../pages/HeroesPage.vue'),
    },
    {
      path: '/heroes/:id',
      name: 'hero-detail',
      component: () => import('../pages/HeroDetailPage.vue'),
    },
    {
      path: '/meta',
      name: 'meta',
      component: () => import('../pages/MetaPage.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../pages/AboutPage.vue'),
    },
  ],
})

export default router
