import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, PermissionKey, MerchantRole } from '@/types'

const ROLE_PERMISSIONS: Record<MerchantRole, PermissionKey[]> = {
  owner: ['product:manage', 'order:manage', 'customer:view', 'analytics:view', 'settings:manage'],
  manager: ['product:manage', 'order:manage', 'customer:view', 'analytics:view'],
  staff: ['product:manage', 'customer:view']
}

// Token helpers — 注意：真实应用应使用 httpOnly cookie 存储 token，此处仅为演示
const TOKEN_KEY = 'jadeite_token'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
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
      // 注意：真实应用应使用 httpOnly cookie 存储 token，此处仅为演示
      const token = `token_${Date.now()}_${Math.random().toString(36).slice(2)}`
      localStorage.setItem(TOKEN_KEY, token)
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

  /** 商家端：切换子角色模拟权限区分 */
  function setMerchantRole(roleType: MerchantRole) {
    merchantRole.value = roleType
    userInfo.value.permissions = ROLE_PERMISSIONS[roleType]
    userInfo.value.name =
      roleType === 'owner' ? '张商家' : roleType === 'manager' ? '王经理' : '李员工'
  }

  function logout() {
    clearToken()
    userInfo.value = { id: '', name: '', phone: '', avatar: '', role: 'user', permissions: [] }
    isLoggedIn.value = false
    merchantRole.value = 'owner'
  }

  function switchRole(role: 'user' | 'merchant' | 'admin') {
    userInfo.value.role = role
  }

  return { userInfo, isLoggedIn, role, merchantRole, hasPermission, login, logout, switchRole, setMerchantRole, getToken }
})