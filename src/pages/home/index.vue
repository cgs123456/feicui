<template>
  <div class="home-page">
    <!-- Header -->
    <div class="home-header">
      <div class="header-left">
        <div class="header-logo">💎</div>
        <span class="header-title">AI翡翠匹配</span>
      </div>
      <div class="header-right">
        <button class="merchant-btn" aria-label="商家入驻" @click="handleMerchantEntry">
          商家入驻
        </button>
      </div>
    </div>

    <!-- Toggle Bar -->
    <van-tabs v-model:active="activeTab" class="home-tabs" sticky>
      <van-tab title="AI找货">
        <!-- Chat Area -->
        <div ref="chatAreaRef" class="chat-area">
          <!-- Welcome Message -->
          <div v-if="messages.length === 0" class="welcome-section">
            <div class="welcome-bubble">
              <div class="ai-avatar-sm">
                <span>AI</span>
              </div>
              <div class="welcome-content">
                <p class="welcome-text">
                  您好！我是翡翠阁AI顾问，很高兴为您服务。我可以帮您挑选翡翠饰品、解答翡翠知识，或根据您的预算和喜好推荐合适的产品。请问有什么可以帮您的？
                </p>
              </div>
            </div>
            <div class="quick-suggestions">
              <button
                v-for="(suggestion, idx) in quickSuggestions"
                :key="idx"
                class="suggestion-pill"
                :aria-label="'快速提问：' + suggestion"
                @click="sendQuickSuggestion(suggestion)"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <!-- Chat Messages -->
          <template v-else>
            <ChatBubble
              v-for="(msg, idx) in messages"
              :key="idx"
              :message="msg"
              :is-last="idx === messages.length - 1"
            />
            <!-- AI 思考中加载动画 -->
            <div v-if="aiLoading" class="typing-indicator" role="status" aria-label="AI正在思考">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <span class="typing-text">AI 正在为您匹配翡翠...</span>
            </div>
          </template>
        </div>

        <!-- Bottom Input Bar -->
        <div class="bottom-bar">
          <div class="input-row">
            <textarea
              v-model="inputText"
              class="chat-input"
              placeholder="请输入您的翡翠需求..."
              aria-label="请输入您的翡翠需求"
              rows="1"
              @keydown.enter.exact.prevent="handleSend"
            ></textarea>
            <button
              class="send-btn"
              :class="{ disabled: !inputText.trim() }"
              :disabled="!inputText.trim()"
              aria-label="AI匹配"
              @click="handleSend"
            >
              AI匹配
            </button>
          </div>
          <p class="disclaimer">AI智能匹配，仅供参考，不做鉴定与交易</p>
        </div>
      </van-tab>

      <van-tab title="精选推荐">
        <div class="featured-content">
          <!-- Section 1: 热门推荐 -->
          <div class="section">
            <div class="section-header">
              <h3 class="section-title">🔥 热门推荐</h3>
              <span class="section-more" @click="goToProductList">更多</span>
            </div>
            <div class="horizontal-scroll">
              <div
                v-for="product in hotProducts"
                :key="product.id"
                class="product-card-h"
                @click="goToProductDetail(product.id)"
              >
                <van-image :src="product.cover" width="100" height="100" fit="cover" radius="8" />
                <span class="product-card-title">{{ product.title }}</span>
                <span class="product-card-price">¥{{ (product.price || 0).toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <!-- Section 2: 新品上架 -->
          <div class="section">
            <div class="section-header">
              <h3 class="section-title">🆕 新品上架</h3>
              <span class="section-more" @click="goToProductList">更多</span>
            </div>
            <div class="horizontal-scroll">
              <div
                v-for="product in newProducts"
                :key="product.id"
                class="product-card-h"
                @click="goToProductDetail(product.id)"
              >
                <van-image :src="product.cover" width="100" height="100" fit="cover" radius="8" />
                <span class="product-card-title">{{ product.title }}</span>
                <span class="product-card-price">¥{{ (product.price || 0).toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <!-- Section 3: 爆款排行 -->
          <div class="section">
            <div class="section-header">
              <h3 class="section-title">🏆 爆款排行</h3>
            </div>
            <div class="ranking-list">
              <div
                v-for="(product, idx) in topProducts"
                :key="product.id"
                class="ranking-item"
                @click="goToProductDetail(product.id)"
              >
                <div class="rank-badge" :class="'rank-' + (idx + 1)">
                  <span>{{ idx + 1 }}</span>
                </div>
                <van-image :src="product.cover" width="60" height="60" fit="cover" radius="6" />
                <div class="ranking-info">
                  <span class="ranking-title">{{ product.title }}</span>
                  <span class="ranking-price">¥{{ (product.price || 0).toLocaleString() }}</span>
                </div>
                <span class="ranking-views">{{ (product.views || 0).toLocaleString() }}次浏览</span>
              </div>
            </div>
          </div>

          <!-- Section 4: 翡翠知识 -->
          <div class="section">
            <div class="section-header">
              <h3 class="section-title">📖 翡翠知识</h3>
            </div>
            <div class="knowledge-list">
              <div class="knowledge-card">
                <span class="knowledge-icon">💎</span>
                <div class="knowledge-info">
                  <span class="knowledge-title">翡翠种水等级</span>
                  <span class="knowledge-desc">玻璃种 &gt; 冰种 &gt; 糯种 &gt; 豆种，种水越通透价值越高</span>
                </div>
              </div>
              <div class="knowledge-card">
                <span class="knowledge-icon">🔍</span>
                <div class="knowledge-info">
                  <span class="knowledge-title">如何辨别A货</span>
                  <span class="knowledge-desc">看证书、看光泽、看结构，正规渠道购买更放心</span>
                </div>
              </div>
              <div class="knowledge-card">
                <span class="knowledge-icon">🛡️</span>
                <div class="knowledge-info">
                  <span class="knowledge-title">翡翠保养技巧</span>
                  <span class="knowledge-desc">避免碰撞、远离化学品、定期清洗保养</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useProductStore } from '../../stores/product'
import ChatBubble from '../../components/ChatBubble.vue'
import TabBar from '../../components/TabBar.vue'
import { getAIResponse } from '../../services/aiMatch'
import type { ChatMessage, Product } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()

const activeTab = ref(0)
const inputText = ref('')
const messages = ref<ChatMessage[]>([])
const chatAreaRef = ref<HTMLElement | null>(null)
const aiLoading = ref(false)

const quickSuggestions = [
  '10万预算 帝王绿手镯',
  '冰种平安扣 预算2万 无纹无裂',
  '冰种翡翠吊坠 送人自用均可'
]

// 精选推荐 - 热门推荐（按 popularity 降序）
const hotProducts = computed(() => {
  return [...productStore.products]
    .filter(p => p.status === 'active')
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 4)
})

// 精选推荐 - 新品上架（按 createTime 降序）
const newProducts = computed(() => {
  return [...productStore.products]
    .filter(p => p.status === 'active')
    .sort((a, b) => new Date(b.createTime || 0).getTime() - new Date(a.createTime || 0).getTime())
    .slice(0, 4)
})

// 精选推荐 - 爆款排行（按 views 降序）
const topProducts = computed(() => {
  return [...productStore.products]
    .filter(p => p.status === 'active')
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3)
})

function goToProductDetail(id: string) {
  router.push(`/products/${id}`)
}

function goToProductList() {
  router.push('/products')
}

function scrollToBottom() {
  nextTick(() => {
    if (chatAreaRef.value) {
      chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
    }
  })
}

watch(
  messages,
  () => {
    scrollToBottom()
  },
  { deep: true }
)

function sendQuickSuggestion(text: string) {
  sendMessage(text)
}

function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  sendMessage(text)
}

function sendMessage(text: string) {
  const userMsg: ChatMessage = {
    role: 'user',
    content: text,
    ts: new Date().toISOString()
  }
  messages.value.push(userMsg)
  inputText.value = ''

  // 显示 AI 思考动画
  aiLoading.value = true
  setTimeout(() => {
    const { reply, recommendations } = getAIResponse(
      text,
      productStore.products as Product[],
      3
    )
    const aiMsg: ChatMessage = {
      role: 'assistant',
      content: reply,
      products: recommendations.length > 0 ? recommendations : undefined,
      ts: new Date().toISOString()
    }
    messages.value.push(aiMsg)
    aiLoading.value = false
  }, 1500)
}

function handleMerchantEntry() {
  if (!userStore.isLoggedIn) {
    router.push('/merchant/login')
  } else {
    router.push('/merchant/dashboard')
  }
}
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #f5f5f5;
  padding-bottom: 50px;
  position: relative;
}

/* Header */
.home-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-logo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8f8ef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.merchant-btn {
  border: 1px solid #07c160;
  color: #07c160;
  background: #fff;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 13px;
  cursor: pointer;
}

/* Tabs */
.home-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.home-tabs :deep(.van-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.home-tabs :deep(.van-tab__panel) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Chat Area */
.chat-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px 0;
}

/* Welcome Section */
.welcome-section {
  padding: 24px 12px;
}

.welcome-bubble {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 20px;
}

.ai-avatar-sm {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #07c160;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-avatar-sm span {
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.welcome-content {
  max-width: 80%;
}

.welcome-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background: #fff;
  padding: 12px 14px;
  border-radius: 4px 16px 16px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.quick-suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 4px;
}

.suggestion-pill {
  display: block;
  width: fit-content;
  max-width: 90%;
  padding: 10px 16px;
  border-radius: 20px;
  border: 1px solid #d0f0df;
  background: #e8f8ef;
  color: #058040;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  line-height: 1.4;
  transition: all 0.2s;
}

.suggestion-pill:active {
  background: #d0f0df;
}

/* Bottom Input Bar */
.bottom-bar {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #eee;
  padding: 10px 12px 14px;
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.chat-input {
  flex: 1;
  background: #f2f2f2;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.4;
  border: none;
  outline: none;
  resize: none;
  max-height: 80px;
}

.send-btn {
  flex-shrink: 0;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.send-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.disclaimer {
  text-align: center;
  font-size: 11px;
  color: #999;
  margin-top: 6px;
}

/* AI 思考中动画 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  margin: 0 12px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #07c160;
  border-radius: 50%;
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dot:nth-child(2) {
  animation-delay: -0.16s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.typing-text {
  font-size: 13px;
  color: #999;
  margin-left: 4px;
}

/* ===== 精选推荐 ===== */
.featured-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px 0 20px;
}

.section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.section-more {
  font-size: 12px;
  color: #07c160;
  cursor: pointer;
}

/* 横向滚动 */
.horizontal-scroll {
  display: flex;
  gap: 10px;
  padding: 0 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.horizontal-scroll::-webkit-scrollbar {
  display: none;
}

.product-card-h {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  width: 110px;
  cursor: pointer;
}

.product-card-title {
  font-size: 12px;
  color: #333;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-card-price {
  font-size: 14px;
  color: #e53e3e;
  font-weight: 600;
}

/* 爆款排行 */
.ranking-list {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.rank-badge.rank-1 {
  background: linear-gradient(135deg, #f5af19, #f12711);
}

.rank-badge.rank-2 {
  background: linear-gradient(135deg, #bdc3c7, #8e9eab);
}

.rank-badge.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #a0522d);
}

.ranking-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.ranking-title {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranking-price {
  font-size: 14px;
  color: #e53e3e;
  font-weight: 600;
}

.ranking-views {
  font-size: 11px;
  color: #999;
  flex-shrink: 0;
}

/* 翡翠知识 */
.knowledge-list {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.knowledge-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #e8f8ee;
  border-radius: 10px;
  padding: 14px;
  cursor: default;
}

.knowledge-icon {
  font-size: 24px;
  flex-shrink: 0;
  line-height: 1;
}

.knowledge-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.knowledge-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.knowledge-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}
</style>