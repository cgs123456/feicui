<template>
  <div class="page-container">
    <AppNavbar title="账户权限" fallback="/merchant/dashboard" />
    <div class="account-content">
      <AccountInfo />

      <!-- 角色管理 -->
      <RoleSection v-if="userStore.hasPermission('settings:manage')" />

      <!-- 权限列表 -->
      <PermissionSection v-if="userStore.hasPermission('settings:manage')" />

      <!-- 设置 -->
      <SettingsMenu
        @open-change-pwd="showChangePwd = true"
        @open-privacy="showPrivacy = true"
        @open-about="showAbout = true"
        @open-agreement="showAgreement = true"
        @open-privacy-policy="showPrivacyPolicy = true"
      />

      <!-- 修改密码 -->
      <ChangePasswordDialog v-model:show="showChangePwd" />

      <!-- 隐私设置 -->
      <PrivacySettingsPopup v-model:show="showPrivacy" />

      <!-- 关于我们 -->
      <AboutDialog v-model:show="showAbout" />

      <!-- 用户协议 -->
      <AgreementPopup v-model:show="showAgreement" />

      <!-- 隐私政策 -->
      <PrivacyPolicyPopup v-model:show="showPrivacyPolicy" />

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

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import AppNavbar from '@/components/AppNavbar.vue'
import AccountInfo from './components/AccountInfo.vue'
import RoleSection from './components/RoleSection.vue'
import PermissionSection from './components/PermissionSection.vue'
import SettingsMenu from './components/SettingsMenu.vue'
import ChangePasswordDialog from './components/ChangePasswordDialog.vue'
import PrivacySettingsPopup from './components/PrivacySettingsPopup.vue'
import AboutDialog from './components/AboutDialog.vue'
import AgreementPopup from './components/AgreementPopup.vue'
import PrivacyPolicyPopup from './components/PrivacyPolicyPopup.vue'

const router = useRouter()
const userStore = useUserStore()

const showChangePwd = ref(false)
const showPrivacy = ref(false)
const showAbout = ref(false)
const showAgreement = ref(false)
const showPrivacyPolicy = ref(false)

function handleLogout() {
  userStore.logout()
  showToast('已退出登录')
  router.push('/')
}
</script>

<style scoped>
.page-container {
  min-height: 100dvh;
  background: #f5f5f5;
  max-width: 430px;
  margin: 0 auto;
}

.account-content {
  padding: 12px 16px;
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
</style>
