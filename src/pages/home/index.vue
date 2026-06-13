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
        <ChatWindow
          :messages="messages"
          :loading="aiLoading"
          :requirement="currentRequirement"
          @quick-suggestion="sendQuickSuggestion"
          @contextual-reply="sendMessage"
        />
        <ChatInput @send="sendMessage" />
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
                <van-image :src="thumbnail(product.cover)" width="100" height="100" fit="cover" radius="8" lazy-load />
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
                <van-image :src="thumbnail(product.cover)" width="100" height="100" fit="cover" radius="8" lazy-load />
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
                <van-image :src="thumbnail(product.cover)" width="60" height="60" fit="cover" radius="6" lazy-load />
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useProductStore } from '../../stores/product'
import ChatWindow from '../../components/ChatWindow.vue'
import ChatInput from '../../components/ChatInput.vue'
import TabBar from '../../components/TabBar.vue'
import { getAIResponse, parseUserRequirement } from '../../services/aiMatch'
import { thumbnail } from '@/utils/image'
import type { ChatMessage, Product, UserRequirement } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()

const activeTab = ref(0)
const messages = ref<ChatMessage[]>([])
const aiLoading = ref(false)
const currentRequirement = ref<UserRequirement | null>(null)

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

function sendQuickSuggestion(text: string) {
  sendMessage(text)
}

function sendMessage(text: string) {
  const userMsg: ChatMessage = {
    role: 'user',
    content: text,
    ts: new Date().toISOString()
  }
  messages.value.push(userMsg)

  // 更新需求识别
  currentRequirement.value = parseUserRequirement(text)

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
