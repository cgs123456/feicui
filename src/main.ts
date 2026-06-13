import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'vant/lib/index.css'
import './styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// Network status
window.addEventListener('offline', () => {
  router.push('/offline')
})
window.addEventListener('online', () => {
  // If on offline page, go back
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
