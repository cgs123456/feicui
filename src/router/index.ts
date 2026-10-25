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
  {
    path: '/addresses',
    name: 'address-list',
    component: () => import('../pages/address-list/index.vue')
  },
  {
    path: '/addresses/new',
    name: 'address-new',
    component: () => import('../pages/address-edit/index.vue')
  },
  {
    path: '/addresses/:id/edit',
    name: 'address-edit',
    component: () => import('../pages/address-edit/index.vue')
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

  // 离线页面
  {
    path: '/offline',
    name: 'offline',
    component: () => import('../pages/offline/index.vue')
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
  routes,
  // 移动端 H5：新导航回顶部，浏览器回退保留滚动位置
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  }
})

// 页面标题映射（以 route.name 为键，兜底站点名）
const ROUTE_TITLES: Record<string, string> = {
  home: '翡翠商城',
  'product-list': '全部商品',
  'product-detail': '商品详情',
  profile: '我的',
  'order-confirm': '确认订单',
  'order-success': '下单成功',
  'order-list': '我的订单',
  'order-detail': '订单详情',
  cart: '购物车',
  favorites: '我的收藏',
  compare: '商品对比',
  'address-list': '收货地址',
  'address-new': '新增地址',
  'address-edit': '编辑地址',
  login: '商家登录',
  dashboard: '商家看板',
  'merchant-product-list': '商品管理',
  'customer-list': '客资管理',
  'merchant-orders': '订单管理',
  'merchant-order-detail': '订单详情',
  'customer-detail': '客户详情',
  account: '账号设置',
  publish: '发布商品',
  'publish-ai': 'AI 找货',
  'product-edit': '编辑商品',
  offline: '离线模式',
  'not-found': '页面不存在'
}

router.afterEach(to => {
  document.title = ROUTE_TITLES[to.name as string] || '翡翠商城'
})

// 路由守卫：保护 B 端商家页面 + 处理未登录的敏感操作
const merchantRoutes = ['/merchant']

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
