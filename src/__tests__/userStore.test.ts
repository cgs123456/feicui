import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../stores/user'
import { useProductStore } from '../stores/product'
import { useAddressStore } from '../stores/address'

vi.mock('../api/user', () => ({
  loginApi: vi.fn()
}))

vi.mock('../api/http', () => ({
  setToken: vi.fn(),
  clearToken: vi.fn()
}))

import { loginApi } from '../api/user'
import { setToken, clearToken } from '../api/http'

const mockedLoginApi = vi.mocked(loginApi)
const mockedSetToken = vi.mocked(setToken)
const mockedClearToken = vi.mocked(clearToken)

describe('userStore（server 模式登录）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('owner 登录成功：存 token、映射 UserInfo 并持久化', async () => {
    const store = useUserStore()
    mockedLoginApi.mockResolvedValue({
      success: true,
      user: { id: 'M001', phone: '13800000000', role: 'owner', nickname: '张商家' },
      token: 'jwt-token'
    })

    const ok = await store.login('13800000000', '1234')

    expect(ok).toBe(true)
    expect(mockedLoginApi).toHaveBeenCalledWith('13800000000', '1234')
    expect(mockedSetToken).toHaveBeenCalledWith('jwt-token')
    expect(store.isLoggedIn).toBe(true)
    expect(store.userInfo.role).toBe('merchant')
    expect(store.userInfo.name).toBe('张商家')
    expect(JSON.parse(localStorage.getItem('jadeite_user_info')!).phone).toBe('13800000000')
  })

  it('buyer 登录成功：角色映射为 user', async () => {
    const store = useUserStore()
    mockedLoginApi.mockResolvedValue({
      success: true,
      user: { id: 'U9', phone: '13900000000', role: 'buyer', nickname: '小翠' },
      token: 'jwt-token'
    })

    const ok = await store.login('13900000000', '1234')

    expect(ok).toBe(true)
    expect(store.userInfo.role).toBe('user')
    expect(store.userInfo.name).toBe('小翠')
  })

  it('success:false（验证码错误 1001 等）返回 false 且不写 token', async () => {
    const store = useUserStore()
    mockedLoginApi.mockResolvedValue({ success: false })

    const ok = await store.login('13800000000', '0000')

    expect(ok).toBe(false)
    expect(mockedSetToken).not.toHaveBeenCalled()
    expect(store.isLoggedIn).toBe(false)
  })

  it('网络/ApiError 异常返回 false 不外抛', async () => {
    const store = useUserStore()
    mockedLoginApi.mockRejectedValue(new Error('boom'))

    await expect(store.login('13800000000', '1234')).resolves.toBe(false)
    expect(store.isLoggedIn).toBe(false)
  })

  it('logout 清 token 与本地缓存并清空商品/地址镜像', async () => {
    const userStore = useUserStore()
    const productStore = useProductStore()
    const addressStore = useAddressStore()
    productStore.products = [{ id: 'P001' } as never]
    addressStore.addresses = [{ id: 'ADDR001' } as never]
    localStorage.setItem('jadeite_user_info', 'x')
    localStorage.setItem('jadeite_merchant_role', 'owner')

    userStore.logout()

    expect(mockedClearToken).toHaveBeenCalledTimes(1)
    expect(userStore.isLoggedIn).toBe(false)
    expect(localStorage.getItem('jadeite_user_info')).toBeNull()
    expect(productStore.products).toHaveLength(0)
    expect(addressStore.addresses).toHaveLength(0)
  })
})
