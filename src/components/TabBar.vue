<template>
  <van-tabbar
    v-model="active"
    route
    active-color="#07C160"
    inactive-color="#999"
    fixed
    safe-area-inset-bottom
    role="navigation"
    aria-label="主导航"
  >
    <van-tabbar-item icon="home-o" to="/" aria-label="首页">首页</van-tabbar-item>
    <van-tabbar-item icon="search" to="/products" aria-label="商品">商品</van-tabbar-item>
    <van-tabbar-item icon="cart-o" :badge="cartBadge" to="/cart" aria-label="购物车">购物车</van-tabbar-item>
    <van-tabbar-item icon="user-o" to="/profile" aria-label="我的">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const cartStore = useCartStore()
const active = ref(0)

const cartBadge = computed(() => {
  const count = cartStore.totalCount
  return count > 0 ? (count > 99 ? '99+' : String(count)) : ''
})

watch(
  () => route.path,
  path => {
    if (path === '/') active.value = 0
    else if (path.startsWith('/products')) active.value = 1
    else if (path === '/cart') active.value = 2
    else if (path === '/profile') active.value = 3
  },
  { immediate: true }
)
</script>