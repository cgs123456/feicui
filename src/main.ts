import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { showToast, Lazyload } from 'vant'
import App from './App.vue'
import router from './router'
import 'vant/lib/index.css'
import './styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Lazyload)
app.mount('#app')

// 全局 API 错误提示
window.addEventListener('api-error', ((e: CustomEvent) => {
  const msg = e.detail?.message || '请求失败'
  showToast({ message: msg, position: 'top' })
}) as EventListener)

// 全局 localStorage 写入失败提示
window.addEventListener('storage-error', ((e: CustomEvent) => {
  const msg = e.detail?.message || '本地存储写入失败'
  showToast({ message: msg, position: 'top' })
}) as EventListener)

// Network status
window.addEventListener('offline', () => {
  router.push('/offline')
})
window.addEventListener('online', () => {
  if (router.currentRoute.value.path === '/offline') {
    router.push('/')
  }
})

// PWA update notification
if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}
