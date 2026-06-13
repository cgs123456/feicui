<template>
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
          @click="$emit('quick-suggestion', suggestion)"
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
      <div v-if="loading" class="typing-indicator" role="status" aria-label="AI正在思考">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <span class="typing-text">AI 正在为您匹配翡翠...</span>
      </div>

      <!-- 需求标签卡片 -->
      <div v-if="requirement && messages.length > 0" class="requirement-card">
        <div class="requirement-header">已识别需求</div>
        <div class="requirement-tags">
          <van-tag v-if="requirement.budget" type="primary" plain size="medium">
            预算: ¥{{ requirement.budget.toLocaleString() }}
          </van-tag>
          <van-tag v-if="requirement.category" type="success" plain size="medium">
            {{ requirement.category }}
          </van-tag>
          <van-tag v-if="requirement.material" type="warning" plain size="medium">
            {{ requirement.material }}
          </van-tag>
          <van-tag v-if="requirement.waterGrade" plain size="medium">
            {{ requirement.waterGrade }}
          </van-tag>
          <van-tag v-if="requirement.color" plain size="medium">
            {{ requirement.color }}
          </van-tag>
          <van-tag v-if="requirement.giftScene" plain size="medium">
            {{ requirement.giftScene }}
          </van-tag>
        </div>
      </div>

      <!-- 上下文快捷回复 -->
      <div v-if="!loading && messages.length > 0" class="contextual-replies">
        <button
          v-for="(reply, idx) in contextualReplies"
          :key="idx"
          class="contextual-reply-btn"
          @click="$emit('contextual-reply', reply)"
        >
          {{ reply }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import ChatBubble from './ChatBubble.vue'
import type { ChatMessage, UserRequirement } from '@/types'

const props = defineProps<{
  messages: ChatMessage[]
  loading: boolean
  requirement: UserRequirement | null
}>()

defineEmits<{
  'quick-suggestion': [text: string]
  'contextual-reply': [text: string]
}>()

const chatAreaRef = ref<HTMLElement | null>(null)

const quickSuggestions = [
  '10万预算 帝王绿手镯',
  '冰种平安扣 预算2万 无纹无裂',
  '冰种翡翠吊坠 送人自用均可'
]

const contextualReplies = computed(() => {
  const replies = ['再推荐几款', '便宜点', '品质更好的']
  if (props.requirement?.category) {
    replies.push(`换个品类`)
  }
  return replies
})

function scrollToBottom() {
  nextTick(() => {
    if (chatAreaRef.value) {
      chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
    }
  })
}

watch(
  () => props.messages,
  () => {
    scrollToBottom()
  },
  { deep: true }
)

watch(
  () => props.loading,
  () => {
    scrollToBottom()
  }
)
</script>

<style scoped>
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
  0%,
  80%,
  100% {
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

/* 需求标签卡片 */
.requirement-card {
  margin: 12px 12px 0;
  background: #f9fff9;
  border: 1px solid #d0f0df;
  border-radius: 10px;
  padding: 10px 14px;
}

.requirement-header {
  font-size: 12px;
  font-weight: 600;
  color: #07c160;
  margin-bottom: 8px;
}

.requirement-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 上下文快捷回复 */
.contextual-replies {
  display: flex;
  gap: 8px;
  padding: 12px 12px 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.contextual-replies::-webkit-scrollbar {
  display: none;
}

.contextual-reply-btn {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid #d0f0df;
  background: #fff;
  color: #058040;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.contextual-reply-btn:active {
  background: #e8f8ef;
}
</style>
