import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../stores/user'

describe('userStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始状态为未登录', () => {
    const store = useUserStore()
    expect(store.isLoggedIn).toBe(false)
    expect(store.userInfo.role).toBe('user')
  })

  it('login 使用正确验证码应成功', () => {
    const store = useUserStore()
    const result = store.login('13800000001', '1234', '5678')
    expect(result).toBe(true)
    expect(store.isLoggedIn).toBe(true)
    expect(store.userInfo.role).toBe('merchant')
  })

  it('login 使用错误验证码应失败', () => {
    const store = useUserStore()
    const result = store.login('13800000001', '0000', '5678')
    expect(result).toBe(false)
    expect(store.isLoggedIn).toBe(false)
  })

  it('logout 应清除登录态', () => {
    const store = useUserStore()
    store.login('13800000001', '1234', '5678')
    store.logout()
    expect(store.isLoggedIn).toBe(false)
    expect(store.userInfo.id).toBe('')
  })

  it('switchRole 应切换角色', () => {
    const store = useUserStore()
    store.login('13800000001', '1234', '5678')
    expect(store.role).toBe('merchant')
    store.switchRole('user')
    expect(store.role).toBe('user')
  })
})
