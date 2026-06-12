<template>
  <div
    class="chat-bubble-wrapper"
    :class="message.role === 'user' ? 'user-wrapper' : 'assistant-wrapper'"
  >
    <!-- AI 头像 -->
    <div v-if="message.role === 'assistant'" class="ai-avatar">
      <span>AI</span>
    </div>

    <div class="chat-bubble-body" :class="message.role === 'user' ? 'user-body' : 'assistant-body'">
      <!-- 气泡内容 -->
      <div
        class="chat-bubble"
        :class="message.role === 'user' ? 'user-bubble' : 'assistant-bubble'"
      >
        {{ message.content }}
      </div>

      <!-- 商品推荐卡片 -->
      <div
        v-if="message.role === 'assistant' && message.products && message.products.length > 0"
        class="product-mini-list"
      >
        <div
          v-for="item in message.products"
          :key="item.id"
          class="product-mini-card"
          role="button"
          tabindex="0"
          :aria-label="item.title"
          @click="goDetail(item.id)"
        >
          <van-image
            :src="item.cover"
            width="120"
            height="120"
            fit="cover"
            radius="8"
            lazy-load
            class="product-mini-image"
          />
          <p class="product-mini-title">{{ item.title }}</p>
          <p class="product-mini-price">¥{{ item.price }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { ChatMessage } from '@/types'

const router = useRouter()

defineProps<{
  message: ChatMessage
  isLast?: boolean
}>()

function goDetail(id: string) {
  router.push(`/products/${id}`)
}
</script>

<style scoped>
.chat-bubble-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 12px;
}

.user-wrapper {
  justify-content: flex-end;
}

.assistant-wrapper {
  justify-content: flex-start;
}

/* AI 头像 */
.ai-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #07c160;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-avatar span {
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.chat-bubble-body {
  max-width: 80%;
  display: flex;
  flex-direction: column;
}

.user-body {
  align-items: flex-end;
}

.assistant-body {
  align-items: flex-start;
}

/* 气泡 */
.chat-bubble {
  font-size: 14px;
  line-height: 1.6;
  padding: 12px 14px;
  word-break: break-word;
}

.assistant-bubble {
  background: #fff;
  color: #333;
  border-radius: 4px 16px 16px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.user-bubble {
  background: #07c160;
  color: #fff;
  border-radius: 16px 4px 16px 16px;
}

/* 商品迷你卡片滚动区域 */
.product-mini-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-top: 10px;
  padding-bottom: 4px;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
}

.product-mini-list::-webkit-scrollbar {
  display: none;
}

.product-mini-card {
  flex-shrink: 0;
  width: 120px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.15s;
}

.product-mini-card:active {
  transform: scale(0.97);
}

.product-mini-image {
  width: 120px;
  height: 120px;
  display: block;
}

.product-mini-title {
  font-size: 12px;
  color: #333;
  margin: 6px 8px 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-mini-price {
  font-size: 14px;
  font-weight: 600;
  color: #ff4d00;
  margin: 2px 8px 8px;
}
</style>
