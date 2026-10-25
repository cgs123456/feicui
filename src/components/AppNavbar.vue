<template>
  <van-nav-bar
    :title="title"
    :fixed="fixed"
    :left-text="leftArrow ? '' : leftText"
    :right-text="rightText"
    class="app-navbar"
    @click-left="handleBack"
    @click-right="emit('click-right')"
  >
    <template #left>
      <div
        class="navbar-left"
        role="button"
        tabindex="0"
        aria-label="返回上一页"
        @keydown.enter="handleBack"
      >
        <van-icon v-if="leftArrow" name="arrow-left" size="18" />
        <span class="navbar-left-text">{{ leftText }}</span>
      </div>
    </template>
    <template #right>
      <slot name="right">
        <span
          class="navbar-right-text"
          role="button"
          tabindex="0"
          :aria-label="rightText"
          @click="emit('click-right')"
          >{{ rightText }}</span
        >
      </slot>
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
    // fixed=false：导航栏随文档流占位。此前 fixed 盖住每页首屏 46px（收藏卡片被拦截点击等），
    // 且在 430px 居中容器布局下 fixed 导航会铺满全宽。个别需要吸顶的页面自行传 fixed。
    fallback: undefined
  }
)

const emit = defineEmits<{
  'click-left': []
  'click-right': []
}>()

const router = useRouter()

function handleBack() {
  emit('click-left')
  if (props.fallback) {
    router.push(props.fallback)
    return
  }
  // 有浏览历史时真正回退（不向堆栈追加重复记录），无历史才落回默认页
  if (window.history.state?.back) {
    router.back()
    return
  }
  const currentPath = router.currentRoute.value.path
  if (currentPath.startsWith('/merchant')) {
    router.push('/merchant/dashboard')
  } else {
    router.push('/')
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
