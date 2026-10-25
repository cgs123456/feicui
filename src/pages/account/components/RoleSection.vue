<template>
  <div class="role-section card">
    <div class="role-header">
      <van-icon name="manager-o" size="18" color="#07C160" />
      <span class="role-title">角色管理</span>
    </div>
    <div class="role-current">
      当前角色：<span class="role-name">{{ currentRoleLabel }}</span>
    </div>
    <van-radio-group v-model="currentRole" direction="horizontal" @change="onRoleChange">
      <van-radio name="owner"> 店长 </van-radio>
      <van-radio name="manager"> 经理 </van-radio>
      <van-radio name="staff"> 员工 </van-radio>
    </van-radio-group>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import type { MerchantRole } from '@/types'

const userStore = useUserStore()

// 角色管理
const currentRole = ref<MerchantRole>(userStore.merchantRole)

const currentRoleLabel = computed(() => {
  const labels: Record<MerchantRole, string> = {
    owner: '店长',
    manager: '经理',
    staff: '员工'
  }
  return labels[currentRole.value] || '未知'
})

function onRoleChange(role: MerchantRole) {
  userStore.setMerchantRole(role)
  showToast(`已切换为${currentRoleLabel.value}`)
}
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
}

/* 角色管理 */
.role-section {
  margin-top: 12px;
  padding: 14px;
}

.role-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.role-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.role-current {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.role-name {
  color: #07c160;
  font-weight: 600;
}

.role-section :deep(.van-radio-group) {
  display: flex;
  gap: 16px;
}
</style>
