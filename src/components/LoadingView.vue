<template>
  <div class="loading-view" role="status" aria-label="加载中">
    <van-loading size="32" color="#07C160" />
    <p class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>

<style scoped>
.loading-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  min-height: 200px;
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #999;
}
</style>
