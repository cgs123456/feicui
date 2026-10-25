<template>
  <div v-if="loading" class="card ai-loading-card" role="status" aria-label="AI 正在生成商品信息">
    <van-loading size="32" color="#07C160" />
    <p>AI 正在为您生成商品信息...</p>
  </div>
  <div v-else class="card" role="region" aria-label="AI 生成结果">
    <p class="step-hint">AI 已为您生成以下信息，可以修改后使用</p>
    <van-field v-model="title" label="生成标题" />
    <van-field v-model="description" type="textarea" label="生成描述" rows="3" autosize />
    <div class="suggested-tags">
      <span class="tag-label">推荐标签：</span>
      <span v-for="tag in tags" :key="tag" class="suggested-tag">{{ tag }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tags: string[]
  loading: boolean
}>()

const title = defineModel<string>('title', { required: true })
const description = defineModel<string>('description', { required: true })
</script>

<style scoped>
.step-hint {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.ai-loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 20px;
  color: #666;
  font-size: 14px;
}

.suggested-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 12px 16px;
}

.tag-label {
  font-size: 13px;
  color: #999;
}

.suggested-tag {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  background: #e8f8ee;
  color: #07c160;
}
</style>
