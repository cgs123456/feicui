<template>
  <van-cell-group class="settings-group">
    <van-cell title="修改密码" is-link aria-label="修改密码" @click="emit('openChangePwd')" />
    <van-cell title="消息通知" center aria-label="消息通知设置">
      <template #right-icon>
        <van-switch v-model="notificationEnabled" size="24" aria-label="消息通知开关" />
      </template>
    </van-cell>
    <van-cell title="隐私设置" is-link aria-label="隐私设置" @click="emit('openPrivacy')" />
    <van-cell title="关于我们" is-link aria-label="关于我们" @click="emit('openAbout')" />
    <van-cell title="用户协议" is-link aria-label="用户协议" @click="emit('openAgreement')" />
    <van-cell title="隐私政策" is-link aria-label="隐私政策" @click="emit('openPrivacyPolicy')" />
  </van-cell-group>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  openChangePwd: []
  openPrivacy: []
  openAbout: []
  openAgreement: []
  openPrivacyPolicy: []
}>()

const notificationEnabled = ref(true)
</script>

<style scoped>
/* 设置 */
.settings-group {
  border-radius: 10px;
  overflow: hidden;
  margin-top: 12px;
}
</style>
