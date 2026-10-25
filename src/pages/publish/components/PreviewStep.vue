<template>
  <div class="card preview-card">
    <h3 class="preview-title">发布预览</h3>
    <div v-if="images.length > 0" class="preview-images">
      <van-image
        v-for="(img, idx) in [images[0]]"
        :key="idx"
        :src="(img.url || img.content) as string"
        width="200"
        height="200"
        fit="cover"
        radius="8"
      />
    </div>
    <div class="preview-info">
      <div class="preview-row"><span class="preview-label">标题：</span>{{ form.title }}</div>
      <div class="preview-row"><span class="preview-label">品类：</span>{{ form.category }}</div>
      <div class="preview-row"><span class="preview-label">材质：</span>{{ form.material }}</div>
      <div class="preview-row"><span class="preview-label">价格：</span>¥{{ form.price }}</div>
      <div class="preview-row"><span class="preview-label">尺寸：</span>{{ form.size }}</div>
      <div class="preview-row"><span class="preview-label">描述：</span>{{ form.description }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploaderFileListItem } from 'vant'

defineProps<{
  form: {
    title: string
    category: string
    material: string
    price: string
    size: string
    description: string
  }
  images: UploaderFileListItem[]
}>()
</script>

<style scoped>
.preview-card {
  padding: 20px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.preview-images {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-row {
  font-size: 14px;
  color: #333;
  display: flex;
}

.preview-label {
  color: #999;
  flex-shrink: 0;
  width: 56px;
}
</style>
