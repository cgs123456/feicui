<template>
  <div class="section-title">角色管理</div>
  <div class="role-switch card">
    <div class="role-label">当前角色：{{ roleLabel }}</div>
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

const currentRole = ref<MerchantRole>(userStore.merchantRole)

const roleLabel = computed(() => {
  const labels: Record<MerchantRole, string> = {
    owner: '店长',
    manager: '经理',
    staff: '员工'
  }
  return labels[currentRole.value] || '未知'
})

function onRoleChange(role: MerchantRole) {
  userStore.setMerchantRole(role)
  showToast(`已切换为${roleLabel.value}`)
}
</script>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding: 16px 16px 8px;
}

/* 角色切换 */
.role-switch {
  margin: 0 16px;
}

.role-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.role-switch :deep(.van-radio-group) {
  display: flex;
  gap: 16px;
}

.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
}
</style>
