<template>
  <div class="page-container">
    <van-nav-bar title="商家登录" fixed placeholder />
    <div class="login-wrapper">
      <div class="login-card card">
        <div class="login-logo">
          <van-icon name="gem-o" size="48" color="#07C160" />
          <h2 class="login-title">翡翠商家后台</h2>
        </div>
        <van-form @submit="onLogin">
          <van-field
            v-model="phone"
            type="tel"
            maxlength="11"
            placeholder="请输入手机号"
            aria-label="手机号"
            :rules="[{ pattern: /^1\d{10}$/, message: '请输入正确的手机号' }]"
          >
            <template #left-icon>
              <van-icon name="phone-o" />
            </template>
          </van-field>
          <van-field
            v-model="code"
            center
            clearable
            maxlength="4"
            placeholder="请输入验证码"
            aria-label="验证码"
          >
            <template #left-icon>
              <van-icon name="shield-o" />
            </template>
            <template #button>
              <van-button
                size="small"
                type="primary"
                :disabled="!canSendCode"
                @click="sendCode"
                class="code-btn"
              >
                {{ codeBtnText }}
              </van-button>
            </template>
          </van-field>
          <div class="agreement-wrap">
            <van-checkbox v-model="agreed" icon-size="16" />
            <span class="agreement-text">
              已阅读并同意<span class="link">《用户协议》</span>和<span class="link"
                >《隐私政策》</span
              >
            </span>
          </div>
          <van-button
            type="primary"
            block
            round
            native-type="submit"
            :disabled="!canSubmit"
            class="submit-btn"
            aria-label="登录注册"
          >
            登录/注册
          </van-button>
        </van-form>
      </div>
      <p class="login-hint">未注册手机号将自动注册</p>
    </div>

    <!-- 模拟短信验证码弹窗 -->
    <van-overlay :show="showSmsModal" @click="showSmsModal = false" aria-label="短信验证码弹窗">
      <div class="sms-modal" @click.stop>
        <div class="sms-header">
          <van-icon name="chat-o" size="20" color="#07C160" />
          <span>短信验证码</span>
        </div>
        <div class="sms-body">
          <p class="sms-to">发送至：{{ phone }}</p>
          <div class="sms-code-box">
            <span class="sms-label">验证码：</span>
            <span class="sms-code-value">{{ generatedCode }}</span>
          </div>
          <p class="sms-tip">有效期5分钟，请勿泄露</p>
        </div>
        <div class="sms-actions">
          <van-button size="small" plain aria-label="自动填入验证码" @click="autoFillCode"
            >自动填入</van-button
          >
          <van-button
            size="small"
            type="primary"
            aria-label="我知道了"
            @click="showSmsModal = false"
            >我知道了</van-button
          >
        </div>
      </div>
    </van-overlay>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const phone = ref('')
const code = ref('')
const agreed = ref(false)
const countdown = ref(0)
const showSmsModal = ref(false)
const generatedCode = ref('')
let timer = null

const canSendCode = computed(() => {
  return /^1\d{10}$/.test(phone.value) && countdown.value === 0
})

const canSubmit = computed(() => {
  return /^1\d{10}$/.test(phone.value) && code.value.length > 0 && agreed.value
})

const codeBtnText = computed(() => {
  return countdown.value > 0 ? `${countdown.value}s后重发` : '发送验证码'
})

function autoFillCode() {
  code.value = generatedCode.value
  showSmsModal.value = false
  showToast('验证码已自动填入')
}

function sendCode() {
  generatedCode.value = String(Math.floor(Math.random() * 9000) + 1000)
  showSmsModal.value = true
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

function onLogin() {
  if (!canSubmit.value) return
  const success = userStore.login(phone.value, code.value, generatedCode.value)
  if (success) {
    showToast('登录成功')
    router.push('/merchant/dashboard')
  } else {
    showToast('验证码错误')
  }
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.page-container {
  min-height: 100dvh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.login-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 40px 16px 0;
}

.login-card {
  padding: 32px 20px 24px;
}

.login-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
  gap: 10px;
}

.login-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.code-btn {
  border-radius: 16px;
  height: 30px;
  padding: 0 12px;
  font-size: 13px;
}

.agreement-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  font-size: 12px;
  color: #999;
}

.agreement-text .link {
  color: #07c160;
}

.submit-btn {
  margin-top: 16px;
  height: 44px;
  font-size: 16px;
}

.login-hint {
  text-align: center;
  color: #999;
  font-size: 12px;
  margin-top: 16px;
}

/* SMS 弹窗 */
.sms-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
}

.sms-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: #f0faf4;
  font-size: 15px;
  font-weight: 600;
  color: #07c160;
  border-bottom: 1px solid #e8f8ef;
}

.sms-body {
  padding: 20px;
}

.sms-to {
  font-size: 13px;
  color: #999;
  margin-bottom: 16px;
}

.sms-code-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 10px;
}

.sms-label {
  font-size: 14px;
  color: #666;
}

.sms-code-value {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 6px;
  color: #07c160;
}

.sms-tip {
  font-size: 12px;
  color: #bbb;
}

.sms-actions {
  display: flex;
  gap: 10px;
  padding: 0 20px 20px;
  justify-content: flex-end;
}
</style>
