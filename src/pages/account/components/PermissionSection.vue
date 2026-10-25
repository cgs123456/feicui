<template>
  <div class="permission-section card">
    <div class="role-header">
      <van-icon name="shield-o" size="18" color="#07C160" />
      <span class="role-title">当前权限</span>
    </div>
    <div class="permission-list">
      <div v-for="perm in currentPermissions" :key="perm.key" class="permission-item">
        <van-icon
          :name="perm.has ? 'success' : 'close'"
          :color="perm.has ? '#07C160' : '#ccc'"
          size="14"
        />
        <span :class="{ 'perm-disabled': !perm.has }">{{ perm.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { PermissionKey } from '@/types'

const userStore = useUserStore()

const permissionMeta: { key: PermissionKey; label: string }[] = [
  { key: 'product:manage', label: '商品管理' },
  { key: 'order:manage', label: '订单管理' },
  { key: 'customer:view', label: '客资查看' },
  { key: 'analytics:view', label: '数据看板' },
  { key: 'settings:manage', label: '系统设置' }
]

const currentPermissions = computed(() => {
  return permissionMeta.map(p => ({
    key: p.key,
    label: p.label,
    has: userStore.hasPermission(p.key)
  }))
})
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
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

/* 权限列表 */
.permission-section {
  margin-top: 12px;
  padding: 14px;
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
}

.perm-disabled {
  color: #ccc;
}
</style>
