<template>
  <van-nav-bar
    :title="title"
    :fixed="fixed"
    :left-text="leftArrow ? '' : leftText"
    :right-text="rightText"
    @click-left="handleBack"
    @click-right="emit('click-right')"
    class="app-navbar"
  >
    <template #left>
      <div
        class="navbar-left"
        role="button"
        tabindex="0"
        aria-label="返回上一页"
        @click="handleBack"
      >
        <van-icon v-if="leftArrow" name="arrow-left" size="18" />
        <span class="navbar-left-text">{{ leftText }}</span>
      </div>
    </template>
    <template #right>
      <span
        class="navbar-right-text"
        role="button"
        tabindex="0"
        :aria-label="rightText"
        @click="emit('click-right')"
        >{{ rightText }}</span
      >
    </template>
  </van-nav-bar>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    title?: string
    leftText?: string
    leftArrow?: boolean
    rightText?: string
    fixed?: boolean
    /** 自定义返回路径，如果不传则智能判断 */
    fallback?: string
  }>(),
  {
    title: '',
    leftText: '返回',
    leftArrow: true,
    rightText: '',
    fixed: true,
    fallback: undefined
  }
)

const emit = defineEmits<{
  'click-left': []
  'click-right': []
}>()

const router = useRouter()

// 不应该回退到的页面
const badBackTargets = ['/merchant/login', '/login']

function handleBack() {
  emit('click-left')
  // 如果有自定义 fallback，优先使用
  if (props.fallback) {
    router.push(props.fallback)
    return
  }
  // 智能返回：检查是否有历史记录可回退
  if (window.history.length > 1) {
    router.back()
  } else {
    // 没有历史记录，根据当前路径决定默认返回页
    const currentPath = router.currentRoute.value.path
    if (currentPath.startsWith('/merchant')) {
      router.push('/merchant/dashboard')
    } else {
      router.push('/')
    }
  }
}
</script>

<style scoped>
.app-navbar {
  --van-nav-bar-background: #fff;
  --van-nav-bar-icon-color: #333;
  --van-nav-bar-text-color: #333;
  --van-nav-bar-title-font-size: 17px;
  border-bottom: 1px solid #eee;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
}

.navbar-left-text {
  font-size: 14px;
  color: #333;
}

.navbar-right-text {
  font-size: 14px;
  color: #07c160;
  cursor: pointer;
}
</style>
