<template>
  <!-- 根类名避开全局 .bottom-bar（商品详情操作栏 flex 布局），历史上曾因此整条输入区被错误拉伸 -->
  <div class="chat-composer">
    <div class="input-row">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="chat-input"
        :placeholder="placeholder"
        :aria-label="placeholder"
        rows="1"
        :disabled="disabled"
        @input="autoResize"
        @keydown.enter.exact.prevent="handleSend"
      />
      <button
        class="send-btn"
        :class="{ disabled: !inputText.trim() || disabled }"
        :disabled="!inputText.trim() || disabled"
        aria-label="AI匹配"
        @click="handleSend"
      >
        AI匹配
      </button>
    </div>
    <p class="disclaimer">AI智能匹配，仅供参考，不做鉴定与交易</p>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    placeholder: '请输入您的翡翠需求...'
  }
)

const emit = defineEmits<{
  send: [text: string]
}>()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function autoResize() {
  nextTick(() => {
    const el = textareaRef.value
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 80) + 'px'
      el.style.overflowY = el.scrollHeight > 80 ? 'auto' : 'hidden'
    }
  })
}

function handleSend() {
  const text = inputText.value.trim()
  if (!text || props.disabled) return
  emit('send', text)
  inputText.value = ''
  nextTick(() => {
    const el = textareaRef.value
    if (el) {
      el.style.height = 'auto'
    }
  })
}
</script>

<style scoped>
.chat-composer {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #eee;
  padding: 10px 12px 14px;
  padding-bottom: calc(14px + var(--safe-bottom, 0px));
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  background: #f2f2f2;
  border-radius: 8px;
  padding: 10px 12px;

  /* 16px 起，低于该值 iOS 聚焦会触发页面自动放大 */
  font-size: 16px;
  line-height: 1.4;
  border: none;
  outline: none;
  resize: none;
  max-height: 80px;
  overflow-y: hidden;
}

.chat-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  flex-shrink: 0;
  background: var(--jade-500);
  color: #fff;
  border: none;
  border-radius: var(--radius-xl);
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
