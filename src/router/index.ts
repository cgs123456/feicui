import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  // ===== C 端（买家端） =====
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
    path: '/products/:id',
    name: 'product-detail',
    component: () => import('../pages/product-detail/index.vue')
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../pages/profile/index.vue')
  },
  // 订单流程（C 端）
  {
    path: '/order/confirm',
    name: 'order-confirm',
    component: () => import('../pages/order-confirm/index.vue')
  },
  {
    path: '/order/success',
    name: 'order-success',
    component: () => import('../pages/order-success/index.vue')
  },

  // ===== B 端（商家端） =====
  {
    path: '/merchant/login',
    name: 'login',
    component: () => import('../pages/login/index.vue')
  },
  {
    path: '/merchant/dashboard',
    name: 'dashboard',
    component: () => import('../pages/dashboard/index.vue')
  },
  {
    path: '/merchant/products',
    name: 'merchant-product-list',
    component: () => import('../pages/product-list/index.vue')
  },
  {
    path: '/merchant/products/:id/edit',
    name: 'product-edit',
    component: () => import('../pages/product-edit/index.vue')
  },
  {
    path: '/merchant/publish',
    name: 'publish',
    component: () => import('../pages/publish/index.vue')
  },
  {
    path: '/merchant/publish/ai',
    name: 'publish-ai',
    component: () => import('../pages/publish/ai.vue')
  },
  {
    path: '/merchant/customers',
    name: 'customer-list',
    component: () => import('../pages/customer-list/index.vue')
  },
  {
    path: '/merchant/customers/:id',
    name: 'customer-detail',
    component: () => import('../pages/customer-detail/index.vue')
  },
  {
    path: '/merchant/account',
    name: 'account',
    component: () => import('../pages/account/index.vue')
  },

  // 404
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

// 路由守卫：保护 B 端商家页面
const merchantRoutes = ['/merchant']
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  // 排除登录页本身，避免无限重定向
  if (to.path === '/merchant/login') {
    next()
    return
  }
  if (merchantRoutes.some(r => to.path.startsWith(r)) && !userStore.isLoggedIn) {
    next('/merchant/login')
  } else {
    next()
  }
})

export default router