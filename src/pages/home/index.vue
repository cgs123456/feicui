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
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '../../stores/user'
import { useProductStore } from '../../stores/product'
import ChatBubble from '../../components/ChatBubble.vue'
import TabBar from '../../components/TabBar.vue'
import { getAIResponse } from '../../services/aiMatch'
import type { ChatMessage, Product } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const productStore = useProductStore()

const inputText = ref('')
const messages = ref<ChatMessage[]>([])
const chatAreaRef = ref<HTMLElement | null>(null)

const quickSuggestions = [
  '10万预算 帝王绿手镯',
  '冰种平安扣 预算2万 无纹无裂',
  '冰种翡翠吊坠 送人自用均可'
]

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
  }, 1000)
}

function handleMerchantEntry() {
  if (!userStore.isLoggedIn) {
    router.push('/merchant/login')
  } else {
    showToast('您已是商家用户')
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
</style>
