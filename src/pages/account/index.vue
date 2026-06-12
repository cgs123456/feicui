<template>
  <div class="page-container">
    <AppNavbar title="账户权限" @click-left="goBack" />
    <div class="account-content">
      <div class="card account-info">
        <van-image
          :src="
            userStore.userInfo.avatar ||
            'https://ui-avatars.com/api/?name=翡&background=07C160&color=fff&size=100'
          "
          width="56"
          height="56"
          fit="cover"
          round
          lazy-load
          class="account-avatar"
        />
        <div class="account-meta">
          <h3 class="account-name">{{ userStore.userInfo.name }}</h3>
          <p class="account-phone">{{ userStore.userInfo.phone }}</p>
        </div>
      </div>

      <van-cell-group class="settings-group">
        <van-cell title="修改密码" is-link aria-label="修改密码" @click="showChangePwd = true" />
        <van-cell title="消息通知" center aria-label="消息通知设置">
          <template #right-icon>
            <van-switch v-model="notificationEnabled" size="24" aria-label="消息通知开关" />
          </template>
        </van-cell>
        <van-cell title="隐私设置" is-link aria-label="隐私设置" @click="showPrivacy = true" />
        <van-cell title="关于我们" is-link aria-label="关于我们" @click="showAbout = true" />
        <van-cell title="用户协议" is-link aria-label="用户协议" @click="showAgreement = true" />
        <van-cell
          title="隐私政策"
          is-link
          aria-label="隐私政策"
          @click="showPrivacyPolicy = true"
        />
      </van-cell-group>

      <!-- 修改密码 -->
      <van-dialog
        v-model:show="showChangePwd"
        title="修改密码"
        show-cancel-button
        confirm-button-text="确认修改"
        aria-label="修改密码弹窗"
        @confirm="showToast('密码修改成功')"
      >
        <div class="dialog-body">
          <van-field v-model="oldPwd" type="password" label="原密码" placeholder="请输入原密码" />
          <van-field v-model="newPwd" type="password" label="新密码" placeholder="请输入新密码" />
          <van-field
            v-model="confirmPwd"
            type="password"
            label="确认密码"
            placeholder="请再次输入新密码"
          />
        </div>
      </van-dialog>

      <!-- 隐私设置 -->
      <van-popup
        v-model:show="showPrivacy"
        position="bottom"
        round
        :style="{ height: '40vh' }"
        aria-label="隐私设置"
      >
        <div class="popup-header">
          <span class="popup-title">隐私设置</span>
          <van-icon name="cross" size="20" @click="showPrivacy = false" />
        </div>
        <van-cell-group>
          <van-cell title="显示手机号" center>
            <template #right-icon>
              <van-switch v-model="privacyShowPhone" size="24" />
            </template>
          </van-cell>
          <van-cell title="通过手机号找到我" center>
            <template #right-icon>
              <van-switch v-model="privacySearchByPhone" size="24" />
            </template>
          </van-cell>
          <van-cell title="个性化推荐" center>
            <template #right-icon>
              <van-switch v-model="privacyRecommend" size="24" />
            </template>
          </van-cell>
        </van-cell-group>
      </van-popup>

      <!-- 关于我们 -->
      <van-dialog
        v-model:show="showAbout"
        title="关于我们"
        show-cancel-button
        :show-confirm-button="false"
        aria-label="关于我们弹窗"
      >
        <div class="dialog-body">
          <p class="dialog-info">翡翠商城 v1.0.0</p>
          <p class="dialog-info">
            翡翠商城是专业的翡翠珠宝电商平台，致力于为消费者提供高品质的天然翡翠饰品。
          </p>
          <p class="dialog-info">我们与缅甸矿区直接合作，每件翡翠均经过权威鉴定，确保品质如一。</p>
        </div>
      </van-dialog>

      <!-- 用户协议 -->
      <van-popup
        v-model:show="showAgreement"
        position="bottom"
        round
        :style="{ height: '60vh' }"
        aria-label="用户协议"
      >
        <div class="popup-header">
          <span class="popup-title">用户协议</span>
          <van-icon name="cross" size="20" @click="showAgreement = false" />
        </div>
        <div class="popup-body">
          <h4>一、总则</h4>
          <p>欢迎使用翡翠商城。本协议是您与翡翠商城之间关于使用本平台服务的法律协议。</p>
          <h4>二、账号注册</h4>
          <p>用户应提供真实、准确的注册信息。因信息不实导致的后果由用户自行承担。</p>
          <h4>三、商品交易</h4>
          <p>
            平台展示的商品信息仅供参考，具体以实物为准。翡翠为天然宝石，每件商品存在细微差异属正常现象。
          </p>
          <h4>四、售后服务</h4>
          <p>支持7天无理由退换货，商品需保持原状。定制商品除外。</p>
          <h4>五、免责声明</h4>
          <p>因不可抗力导致的交易中断，平台不承担责任。</p>
        </div>
      </van-popup>

      <!-- 隐私政策 -->
      <van-popup
        v-model:show="showPrivacyPolicy"
        position="bottom"
        round
        :style="{ height: '60vh' }"
        aria-label="隐私政策"
      >
        <div class="popup-header">
          <span class="popup-title">隐私政策</span>
          <van-icon name="cross" size="20" @click="showPrivacyPolicy = false" />
        </div>
        <div class="popup-body">
          <h4>一、信息收集</h4>
          <p>我们收集您的手机号、浏览记录等必要信息，用于提供更好的服务体验。</p>
          <h4>二、信息使用</h4>
          <p>您的信息仅用于订单处理、个性化推荐及平台服务优化，不会用于其他商业用途。</p>
          <h4>三、信息保护</h4>
          <p>我们采用加密传输、访问控制等技术手段保护您的信息安全。</p>
          <h4>四、信息共享</h4>
          <p>未经您的明确同意，我们不会向第三方共享您的个人信息，法律法规另有规定的除外。</p>
          <h4>五、Cookie 使用</h4>
          <p>我们使用 Cookie 改善您的浏览体验，您可以在浏览器设置中管理 Cookie 偏好。</p>
        </div>
      </van-popup>

      <div class="logout-wrap">
        <van-button
          type="danger"
          block
          round
          class="logout-btn"
          aria-label="退出登录"
          @click="handleLogout"
        >
          退出登录
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '../../stores/user'
import AppNavbar from '../../components/AppNavbar.vue'

const router = useRouter()
const userStore = useUserStore()

const notificationEnabled = ref(true)

const showChangePwd = ref(false)
const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')

const showPrivacy = ref(false)
const privacyShowPhone = ref(true)
const privacySearchByPhone = ref(true)
const privacyRecommend = ref(true)

const showAbout = ref(false)
const showAgreement = ref(false)
const showPrivacyPolicy = ref(false)

function handleLogout() {
  userStore.logout()
  showToast('已退出登录')
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.page-container {
  min-height: 100dvh;
  background: #f5f5f5;
}

.account-content {
  padding: 12px 16px;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
}

.account-avatar {
  flex-shrink: 0;
}

.account-meta {
  flex: 1;
  min-width: 0;
}

.account-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.account-phone {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.settings-group {
  border-radius: 10px;
  overflow: hidden;
  margin-top: 12px;
}

.logout-wrap {
  margin-top: 32px;
  padding: 0 16px;
}

.logout-btn {
  height: 44px;
  font-size: 16px;
  border-radius: 20px;
}

/* Dialog */
.dialog-body {
  padding: 8px 0;
}

.dialog-body .van-field {
  padding: 10px 16px;
}

.dialog-info {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
  margin: 0;
  padding: 4px 16px;
}

/* Popup */
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.popup-body {
  padding: 16px;
  max-height: calc(60vh - 53px);
  overflow-y: auto;
}

.popup-body h4 {
  font-size: 14px;
  color: #333;
  margin: 14px 0 6px;
}

.popup-body h4:first-child {
  margin-top: 0;
}

.popup-body p {
  font-size: 13px;
  color: #666;
  line-height: 1.8;
  margin: 0;
}
</style>
