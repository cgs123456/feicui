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
        <RecommendSection />
      </van-tab>
    </van-tabs>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useProductStore } from '../../stores/product'
import ChatWindow from '../../components/ChatWindow.vue'
import ChatInput from '../../components/ChatInput.vue'
import TabBar from '../../components/TabBar.vue'
import RecommendSection from './components/RecommendSection.vue'
import { getAIResponseWithContext } from '../../services/aiMatch'
import type { ChatMessage, Product, UserRequirement } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()

const activeTab = ref(0)
const messages = ref<ChatMessage[]>([])
const aiLoading = ref(false)
const currentRequirement = ref<UserRequirement | null>(null)
let aiTimer: ReturnType<typeof setTimeout> | null = null

onUnmounted(() => {
  if (aiTimer !== null) clearTimeout(aiTimer)
})

function sendQuickSuggestion(text: string) {
  sendMessage(text)
}

function sendMessage(text: string) {
  // AI 回复进行中禁止重入：避免 clearTimeout 掉上一条的 1500ms 定时器造成「有问无答」
  if (aiLoading.value) return
  const userMsg: ChatMessage = {
    role: 'user',
    content: text,
    ts: new Date().toISOString()
  }
  // 多轮上下文：传入当前消息之前的历史，供追问/调整预算/换品类识别
  const history = messages.value.slice()
  messages.value.push(userMsg)

  // 显示 AI 思考动画
  aiLoading.value = true
  if (aiTimer !== null) clearTimeout(aiTimer)
  aiTimer = setTimeout(() => {
    aiTimer = null
    const { reply, recommendations, parsedRequirement } = getAIResponseWithContext(
      text,
      productStore.products as Product[],
      history,
      3
    )
    currentRequirement.value = parsedRequirement
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
</style>
