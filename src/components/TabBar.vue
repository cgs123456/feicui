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
    <van-tabbar-item icon="add-o" to="/merchant/publish" aria-label="发布">发布</van-tabbar-item>
    <van-tabbar-item icon="user-o" to="/profile" aria-label="我的">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = ref(0)

watch(
  () => route.path,
  path => {
    if (path === '/') active.value = 0
    else if (path.startsWith('/merchant/publish')) active.value = 1
    else if (path === '/profile') active.value = 2
  },
  { immediate: true }
)
</script>
