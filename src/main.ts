import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { showToast, Lazyload } from 'vant'
import App from './App.vue'
import router from './router'
// 函数式 API（showToast/showDialog 等）不经过模板编译，样式需手动引入
import 'vant/es/toast/style'
import 'vant/es/dialog/style'
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
  // 首次激活接管也会触发 controllerchange（此时此前无 controller），只对「更新接管」做整页刷新
  let hadController = navigator.serviceWorker.controller !== null
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    if (!hadController) {
      hadController = true
      return
    }
    refreshing = true
    window.location.reload()
  })
}
