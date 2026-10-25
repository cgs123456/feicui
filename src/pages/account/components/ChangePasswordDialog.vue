<template>
  <van-dialog
    v-model:show="show"
    title="修改密码"
    show-cancel-button
    confirm-button-text="确认修改"
    aria-label="修改密码弹窗"
    :before-close="handleBeforeClose"
  >
    <div class="dialog-body">
      <van-field v-model="oldPwd" type="password" label="原密码" placeholder="请输入原密码" />
      <van-field
        v-model="newPwd"
        type="password"
        label="新密码"
        placeholder="请输入至少 6 位新密码"
      />
      <van-field
        v-model="confirmPwd"
        type="password"
        label="确认密码"
        placeholder="请再次输入新密码"
      />
    </div>
  </van-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { showToast } from 'vant'

const show = defineModel<boolean>('show', { default: false })

const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')

function resetFields() {
  oldPwd.value = ''
  newPwd.value = ''
  confirmPwd.value = ''
}

function handleBeforeClose(action: string): boolean {
  if (action !== 'confirm') {
    resetFields()
    return true
  }
  if (!oldPwd.value.trim()) {
    showToast('请输入原密码')
    return false
  }
  if (newPwd.value.length < 6) {
    showToast('新密码至少 6 位')
    return false
  }
  if (newPwd.value !== confirmPwd.value) {
    showToast('两次输入的新密码不一致')
    return false
  }
  // mock 环境：本地演示校验通过即视为修改成功
  showToast('密码修改成功')
  resetFields()
  return true
}
</script>

<style scoped>
/* Dialog */
.dialog-body {
  padding: 8px 0;
}

.dialog-body :deep(.van-field) {
  padding: 10px 16px;
}
</style>
