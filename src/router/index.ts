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
  {
    path: '/orders',
    name: 'order-list',
    component: () => import('../pages/order-list/index.vue')
  },
  {
    path: '/order/detail/:id',
    name: 'order-detail',
    component: () => import('../pages/order-detail/index.vue')
  },
  // 购物车 & 收藏
  {
    path: '/cart',
    name: 'cart',
    component: () => import('../pages/cart/index.vue')
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('../pages/favorites/index.vue')
  },
  {
    path: '/compare',
    name: 'compare',
    component: () => import('../pages/compare/index.vue')
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
    path: '/merchant/orders',
    name: 'merchant-orders',
    component: () => import('../pages/merchant-orders/index.vue')
  },
  {
    path: '/merchant/orders/:id',
    name: 'merchant-order-detail',
    component: () => import('../pages/merchant-order-detail/index.vue')
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

// 路由守卫：保护 B 端商家页面 + 处理未登录的敏感操作
const merchantRoutes = ['/merchant']
const cSensitiveRoutes = ['/order/confirm', '/order/success', '/orders', '/order/detail', '/cart', '/favorites']

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()

  // B 端保护：未登录重定向到登录页
  if (to.path === '/merchant/login') {
    // 已登录则直接进入后台
    if (userStore.isLoggedIn) {
      next('/merchant/dashboard')
      return
    }
    next()
    return
  }

  if (merchantRoutes.some(r => to.path.startsWith(r))) {
    if (!userStore.isLoggedIn) {
      next('/merchant/login')
      return
    }
    next()
    return
  }

  // C 端敏感页面（如订单、购物车、收藏）：未登录时提示但允许浏览（demo 阶段不强制）
  next()
})

export default router