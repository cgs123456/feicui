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

<script setup>
import { ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '../../stores/user'
import ChatBubble from '../../components/ChatBubble.vue'
import TabBar from '../../components/TabBar.vue'
import mockProducts from '../../mock/products.json'

const router = useRouter()
const userStore = useUserStore()

const inputText = ref('')
const messages = ref([])
const chatAreaRef = ref(null)

const quickSuggestions = [
  '10万预算 帝王绿手镯',
  '冰种平安扣 预算2万 无纹无裂',
  '冰种翡翠吊坠 送人自用均可'
]

// AI response logic - 关键词匹配 + 预算过滤
const keywordMap = [
  { keys: ['手镯', '手环', '镯子'], cat: '手镯' },
  { keys: ['戒指', '戒面', '指环'], cat: '戒指' },
  { keys: ['吊坠', '挂件', '挂坠'], cat: '吊坠' },
  { keys: ['平安扣'], cat: '平安扣' },
  { keys: ['项链', '项圈', '珠子', '颈链'], cat: '项链' }
]

// 解析预算：支持 "5万" "50000" "2.5万" "预算5w" 等格式
function parseBudget(text) {
  // 匹配 "X万" 或 "X.X万" 或 "Xw" 或 "XW"
  const wanMatch = text.match(/(\d+\.?\d*)\s*[万wW]/)
  if (wanMatch) return Math.floor(parseFloat(wanMatch[1]) * 10000)

  // 匹配 "预算X" 或 "预算 X" 后面跟纯数字
  const budgetMatch = text.match(/预算\s*(\d+)/)
  if (budgetMatch) {
    const num = parseInt(budgetMatch[1])
    // 如果数字较小（如 5），可能是"5万"的简写，按万处理
    if (num <= 100) return num * 10000
    return num
  }

  // 匹配纯数字（至少4位，如 50000）
  const numMatch = text.match(/(\d{4,})/)
  if (numMatch) return parseInt(numMatch[1])

  return null
}

function getAIResponse(userContent) {
  const content = userContent

  // 解析预算
  const budget = parseBudget(content)

  // 按关键词匹配品类
  let matchedCat = null
  for (const item of keywordMap) {
    if (item.keys.some(k => content.includes(k))) {
      matchedCat = item.cat
      break
    }
  }

  // 匹配商品：先按品类，再按预算过滤
  let matchedProducts
  if (matchedCat) {
    matchedProducts = mockProducts.filter(p => p.category === matchedCat)
  }
  if (!matchedProducts || matchedProducts.length === 0) {
    matchedProducts = [...mockProducts]
  }

  // 预算过滤
  if (budget) {
    matchedProducts = matchedProducts.filter(p => p.price <= budget)
    // 按价格从高到低排序（更接近预算的在前面）
    matchedProducts.sort((a, b) => b.price - a.price)
  }

  // 取前3个
  const products = matchedProducts.slice(0, 3).map(p => ({
    id: p.id,
    cover: p.cover,
    title: p.title,
    price: p.price
  }))

  let productText = ''
  products.forEach((p, idx) => {
    productText += `${idx + 1}. ${p.title}（¥${p.price.toLocaleString()}）\n`
  })

  let reply
  if (products.length === 0) {
    reply = budget
      ? `抱歉，在¥${budget.toLocaleString()}预算内暂未找到${matchedCat || '合适'}的商品。建议适当放宽预算范围，或告诉我其他偏好～`
      : `抱歉，暂未找到${matchedCat || '合适'}的商品，请尝试其他品类～`
  } else if (budget) {
    reply = `为您找到${products.length}款¥${budget.toLocaleString()}预算内${matchedCat ? '的' + matchedCat + '品类' : ''}商品：\n\n${productText}\n如需调整预算或品类，请随时告诉我～`
  } else if (matchedCat) {
    reply = `为您找到${matchedCat}品类优质货源：\n\n${productText}\n您可以告诉我预算范围，我帮您精准筛选～`
  } else {
    reply = `为您推荐以下热门翡翠商品：\n\n${productText}\n如需更精准匹配，请告诉我您的具体需求（预算、品类、尺寸等）～`
  }

  return {
    role: 'assistant',
    content: reply,
    products: products.length > 0 ? products : undefined,
    ts: new Date().toISOString()
  }
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

function sendQuickSuggestion(text) {
  sendMessage(text)
}

function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  sendMessage(text)
}

function sendMessage(text) {
  const userMsg = {
    role: 'user',
    content: text,
    ts: new Date().toISOString()
  }
  messages.value.push(userMsg)
  inputText.value = ''

  setTimeout(() => {
    const aiMsg = getAIResponse(text)
    messages.value.push(aiMsg)
  }, 1000)
}

function handleMerchantEntry() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
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
