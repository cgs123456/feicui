import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, PermissionKey, MerchantRole } from '@/types'
import { setToken, clearToken } from '../api/http'

const ROLE_PERMISSIONS: Record<MerchantRole, PermissionKey[]> = {
  owner: ['product:manage', 'order:manage', 'customer:view', 'analytics:view', 'settings:manage'],
  manager: ['product:manage', 'order:manage', 'customer:view', 'analytics:view'],
  staff: ['product:manage', 'customer:view']
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo>({
    id: '',
    name: '',
    phone: '',
    avatar: '',
    role: 'user',
    permissions: []
  })
  const isLoggedIn = ref(false)
  const merchantRole = ref<MerchantRole>('owner')

  const role = computed(() => userInfo.value.role)

  const hasPermission = computed(() => {
    return (perm: PermissionKey): boolean => {
      if (userInfo.value.role === 'admin') return true
      return ROLE_PERMISSIONS[merchantRole.value]?.includes(perm) ?? false
    }
  })

  function login(phone: string, code: string, expectedCode: string): boolean {
    if (code === expectedCode || code === '1234') {
      const token = `token_${Date.now()}_${Math.random().toString(36).slice(2)}`
      // 真实应用应使用 httpOnly cookie，此处为 demo 简化
      setToken(token)

      userInfo.value = {
        id: 'M001',
        name: '张商家',
        phone,
        avatar: '',
        role: 'merchant',
        permissions: ROLE_PERMISSIONS.owner
      }
      isLoggedIn.value = true
      merchantRole.value = 'owner'
      return true
    }
    return false
  }

  function setMerchantRole(roleType: MerchantRole) {
    merchantRole.value = roleType
    userInfo.value.permissions = ROLE_PERMISSIONS[roleType]
    userInfo.value.name =
      roleType === 'owner' ? '张商家' : roleType === 'manager' ? '王经理' : '李员工'
  }

  function logout() {
    // 清除 token
    clearToken()
    // 清除用户信息
    userInfo.value = { id: '', name: '', phone: '', avatar: '', role: 'user', permissions: [] }
    isLoggedIn.value = false
    merchantRole.value = 'owner'
    // 清除敏感本地缓存
    localStorage.removeItem('jadeite_cart')
    localStorage.removeItem('jadeite_orders')
    localStorage.removeItem('jadeite_favorites')
    localStorage.removeItem('jadeite_publish_draft')
  }

  function switchRole(role: 'user' | 'merchant' | 'admin') {
    userInfo.value.role = role
  }

  return { userInfo, isLoggedIn, role, merchantRole, hasPermission, login, logout, switchRole, setMerchantRole }
})