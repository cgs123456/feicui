import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

// 模拟路由守卫逻辑
const routes = [
  {
    path: '/',
    name: 'home',
    component: { template: '<div>Home</div>' }
  },
  {
    path: '/products',
    name: 'product-list',
    component: { template: '<div>Products</div>' }
  },
  {
    path: '/products/:id',
    name: 'product-detail',
    component: { template: '<div>Detail</div>' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: { template: '<div>Profile</div>' }
  },
  {
    path: '/merchant/login',
    name: 'login',
    component: { template: '<div>Login</div>' }
  },
  {
    path: '/merchant/dashboard',
    name: 'dashboard',
    component: { template: '<div>Dashboard</div>' }
  },
  {
    path: '/merchant/products',
    name: 'merchant-product-list',
    component: { template: '<div>B Products</div>' }
  },
  {
    path: '/merchant/publish',
    name: 'publish',
    component: { template: '<div>Publish</div>' }
  },
  {
    path: '/merchant/customers',
    name: 'customer-list',
    component: { template: '<div>Customers</div>' }
  },
  {
    path: '/merchant/account',
    name: 'account',
    component: { template: '<div>Account</div>' }
  }
]

describe('路由守卫', () => {
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    setActivePinia(createPinia())
    router = createRouter({
      history: createWebHashHistory(),
      routes
    })

    // 注册路由守卫
    const merchantRoutes = ['/merchant']
    router.beforeEach((to, _from, next) => {
      const userStore = useUserStore()
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
  })

  it('C 端 /products 不应被拦截', async () => {
    await router.push('/products')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/products')
  })

  it('C 端 /products/:id 不应被拦截', async () => {
    await router.push('/products/P001')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/products/P001')
  })

  it('未登录访问 /merchant/dashboard 应跳转登录', async () => {
    await router.push('/merchant/dashboard')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/merchant/login')
  })

  it('未登录访问 /merchant/products 应跳转登录', async () => {
    await router.push('/merchant/products')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/merchant/login')
  })

  it('登录后访问 /merchant/dashboard 应正常进入', async () => {
    const userStore = useUserStore()
    userStore.login('13800000001', '1234', '1234')

    await router.push('/merchant/dashboard')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/merchant/dashboard')
  })
})