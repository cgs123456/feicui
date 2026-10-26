import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, PermissionKey, MerchantRole } from '@/types'
import { setToken, clearToken } from '../api/http'
import { loginApi } from '../api/user'
import { useProductStore } from './product'
import { useAddressStore } from './address'

const ROLE_PERMISSIONS: Record<MerchantRole, PermissionKey[]> = {
  owner: ['product:manage', 'order:manage', 'customer:view', 'analytics:view', 'settings:manage'],
  manager: ['product:manage', 'order:manage', 'customer:view', 'analytics:view'],
  staff: ['product:manage', 'customer:view']
}

const USER_STORAGE_KEY = 'jadeite_user_info'
const ROLE_STORAGE_KEY = 'jadeite_merchant_role'

function loadPersistedUser(): { info: UserInfo; role: MerchantRole } | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null
    const info = JSON.parse(raw) as UserInfo
    if (!info?.id || !info?.phone) return null
    const role = (localStorage.getItem(ROLE_STORAGE_KEY) as MerchantRole) || 'owner'
    return { info, role: role in ROLE_PERMISSIONS ? role : 'owner' }
  } catch {
    return null
  }
}

const persisted = loadPersistedUser()

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo>(
    persisted?.info ?? {
      id: '',
      name: '',
      phone: '',
      avatar: '',
      role: 'user',
      permissions: []
    }
  )
  const isLoggedIn = ref(!!persisted)
  const merchantRole = ref<MerchantRole>(persisted?.role ?? 'owner')

  const role = computed(() => userInfo.value.role)

  const hasPermission = computed(() => {
    return (perm: PermissionKey): boolean => {
      if (userInfo.value.role === 'admin') return true
      return ROLE_PERMISSIONS[merchantRole.value]?.includes(perm) ?? false
    }
  })

  /** POST /auth/login（错误码 1001 由 http 层抛 ApiError，这里按失败处理） */
  async function login(phone: string, code: string): Promise<boolean> {
    try {
      const res = await loginApi(phone, code)
      // token 是会话的载体：缺失视为登录失败，避免构造出无凭证的"半登录态"
      if (!res.success || !res.user || !res.token) return false
      setToken(res.token)
      // 后端 user 载荷为 {id, phone, role:'owner'|'buyer', nickname}，在此映射为前端 UserInfo
      userInfo.value = {
        id: res.user.id,
        name: res.user.nickname || res.user.phone,
        phone: res.user.phone,
        avatar: '',
        role: res.user.role === 'owner' ? 'merchant' : 'user',
        permissions: [...ROLE_PERMISSIONS.owner]
      }
      isLoggedIn.value = true
      merchantRole.value = 'owner'
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userInfo.value))
      localStorage.setItem(ROLE_STORAGE_KEY, merchantRole.value)
      return true
    } catch {
      return false
    }
  }

  function setMerchantRole(roleType: MerchantRole) {
    merchantRole.value = roleType
    // 拷贝常量表，避免后续 mutate 污染共享数组
    userInfo.value.permissions = [...ROLE_PERMISSIONS[roleType]]
    userInfo.value.name =
      roleType === 'owner' ? '张商家' : roleType === 'manager' ? '王经理' : '李员工'
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userInfo.value))
    localStorage.setItem(ROLE_STORAGE_KEY, roleType)
  }

  function logout() {
    // 清除 token
    clearToken()
    // 清除用户信息
    userInfo.value = { id: '', name: '', phone: '', avatar: '', role: 'user', permissions: [] }
    isLoggedIn.value = false
    merchantRole.value = 'owner'
    // 清除敏感本地缓存（含商家私有数据：商品编辑与收货地址，防止多账号串数据）
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(ROLE_STORAGE_KEY)
    localStorage.removeItem('jadeite_cart')
    localStorage.removeItem('jadeite_favorites')
    localStorage.removeItem('jadeite_publish_draft')
    sessionStorage.removeItem('jadeite_selected_address')
    // 内存镜像同步清空，登录后由各 store 的 syncFromServer 重新拉取
    useProductStore().resetProducts()
    useAddressStore().resetAddresses()
  }

  function switchRole(role: 'user' | 'merchant' | 'admin') {
    userInfo.value.role = role
  }

  return {
    userInfo,
    isLoggedIn,
    role,
    merchantRole,
    hasPermission,
    login,
    logout,
    switchRole,
    setMerchantRole
  }
})
