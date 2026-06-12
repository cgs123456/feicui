import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo>({
    id: '',
    name: '',
    phone: '',
    avatar: '',
    role: 'user'
  })
  const isLoggedIn = ref(false)

  const role = computed(() => userInfo.value.role)

  function login(phone: string, code: string, expectedCode: string): boolean {
    if (code === expectedCode || code === '1234') {
      userInfo.value = {
        id: 'M001',
        name: '张商家',
        phone,
        avatar: '',
        role: 'merchant'
      }
      isLoggedIn.value = true
      return true
    }
    return false
  }

  function logout() {
    userInfo.value = { id: '', name: '', phone: '', avatar: '', role: 'user' }
    isLoggedIn.value = false
  }

  function switchRole(role: 'user' | 'merchant') {
    userInfo.value.role = role
  }

  return { userInfo, isLoggedIn, role, login, logout, switchRole }
})
