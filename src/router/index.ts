import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'about',
      component: () => import('../pages/AboutPage.vue'),
    },
    {
      path: '/draft',
      name: 'draft',
      component: () => import('../pages/MainPage.vue'),
    },
    {
      path: '/about',
      redirect: '/',
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
      path: '/sandbox',
      name: 'sandbox',
      component: () => import('../pages/SandboxPage.vue'),
    },
    {
      path: '/meta',
      name: 'meta',
      component: () => import('../pages/MetaPage.vue'),
    },
  ],
})

export default router
