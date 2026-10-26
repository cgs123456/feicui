import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { VitePWA } from 'vite-plugin-pwa'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '翡翠商城 - AI翡翠匹配',
        short_name: '翡翠商城',
        description: 'AI驱动的翡翠珠宝电商平台',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f5f5',
        theme_color: '#07C160',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            // 商品图 CDN 域名易失效——StaleWhileRevalidate 先回缓存
            urlPattern: /^https:\/\/trae-api-cn\.mchost\.guru\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'remote-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    }),
    Components({
      resolvers: [VantResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // 编辑器原子保存会经 .*.tmpdir 瞬态目录换名写入，Windows 下 fs.watch 命中
    // 未释放的 tmp 文件抛 EBUSY 直接杀死 dev server，故整类目录不监听
    watch: {
      ignored: ['**/.*.tmpdir/**']
    },
    // server 模式（VITE_USE_MOCK=false）下 /api 转发到本地后端（dev 与 preview 同配，README 的 preview 验证流程依赖它）
    proxy: {
      '/api': 'http://localhost:3001'
    },
    // e2e 冷启动预热：提前 transform 全部源码模块，避免首个用例 30s 超时
    warmup: {
      clientFiles: ['./index.html', './src/**/*.{ts,vue,css}']
    }
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
