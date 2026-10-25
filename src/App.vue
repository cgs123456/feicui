<template>
  <div class="app-container">
    <main>
      <router-view v-slot="{ Component }">
        <!-- 仅缓存列表类页面；详情/下单流程页每次进入需刷新最新数据，不缓存 -->
        <keep-alive :include="keepAlivePages">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
// 与各页面 defineOptions({ name }) 对应
const keepAlivePages = [
  'CartPage',
  'ProductListPage',
  'OrderListPage',
  'FavoritesPage',
  'ProfilePage'
]
</script>

<style scoped>
.app-container {
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--bg-color);
  position: relative;
}
</style>
