<template>
  <van-nav-bar
    :title="title"
    :fixed="fixed"
    :left-text="leftArrow ? '' : leftText"
    :right-text="rightText"
    @click-left="emit('click-left')"
    @click-right="emit('click-right')"
    class="app-navbar"
  >
    <template #left>
      <div
        class="navbar-left"
        role="button"
        tabindex="0"
        aria-label="返回上一页"
        @click="emit('click-left')"
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

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  leftText: {
    type: String,
    default: '返回'
  },
  leftArrow: {
    type: Boolean,
    default: true
  },
  rightText: {
    type: String,
    default: ''
  },
  fixed: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click-left', 'click-right'])
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
