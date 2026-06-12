import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/home/index.vue')
  },
  {
    path: '/products',
    name: 'product-list',
    component: () => import('../pages/product-list/index.vue')
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../pages/profile/index.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/login/index.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../pages/dashboard/index.vue')
  },
  {
    path: '/publish',
    name: 'publish',
    component: () => import('../pages/publish/index.vue')
  },
  {
    path: '/publish/ai',
    name: 'publish-ai',
    component: () => import('../pages/publish/ai.vue')
  },
  {
    path: '/products/:id/edit',
    name: 'product-edit',
    component: () => import('../pages/product-edit/index.vue')
  },
  {
    path: '/products/:id',
    name: 'product-detail',
    component: () => import('../pages/product-detail/index.vue')
  },
  {
    path: '/customers',
    name: 'customer-list',
    component: () => import('../pages/customer-list/index.vue')
  },
  {
    path: '/customers/:id',
    name: 'customer-detail',
    component: () => import('../pages/customer-detail/index.vue')
  },
  {
    path: '/account',
    name: 'account',
    component: () => import('../pages/account/index.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../pages/not-found/index.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫：保护商家页面
const merchantRoutes = ['/dashboard', '/publish', '/products', '/customers', '/account']
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  if (merchantRoutes.some(r => to.path.startsWith(r)) && !userStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
