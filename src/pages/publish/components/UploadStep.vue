<template>
  <div class="copy-link" @click="emit('copy')">
    <van-icon name="records" size="14" />
    <span>复制现有商品</span>
  </div>
  <div class="card">
    <p class="step-hint">请上传商品图片（最多9张）</p>
    <van-uploader
      v-model="images"
      :max-count="9"
      :preview-size="100"
      multiple
      :after-read="onAfterRead"
      aria-label="上传商品图片"
    />
  </div>
</template>

<script setup lang="ts">
import type { UploaderFileListItem } from 'vant'

const images = defineModel<UploaderFileListItem[]>({ required: true })
const emit = defineEmits<{ copy: [] }>()

function onAfterRead(file: UploaderFileListItem | UploaderFileListItem[]) {
  const item = Array.isArray(file) ? file[0] : file
  if (item) {
    item.status = 'done'
    item.message = 'success'
  }
}
</script>

<style scoped>
.copy-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  font-size: 13px;
  color: #07c160;
  cursor: pointer;
}

.copy-link:active {
  opacity: 0.7;
}

.step-hint {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}
</style>
