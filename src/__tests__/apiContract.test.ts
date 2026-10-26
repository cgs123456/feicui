import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchMerchantOrders } from '../api/order'
import { loginApi } from '../api/user'

/**
 * 接缝测试：钉住 src/api 层与 server 端 /api 契约的镜像关系。
 * 后端侧形状由 server/src/smoke.ts 断言（data.list 分页壳、UserPayload 字段），
 * 此处反向钉住前端解析侧，任一侧形状漂移都会被两侧测试同时拦截。
 */
describe('api 契约接缝（后端线格式镜像）', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetchMerchantOrders：GET /orders/merchant 返回分页壳，前端解出 list 数组', async () => {
    const order = { id: 'O1', orderNo: 'ORD1', status: 'paid' }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        code: 0,
        data: { list: [order], total: 1, page: 1, pageSize: 20 },
        message: 'ok'
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchMerchantOrders()

    expect(Array.isArray(result)).toBe(true)
    expect(result[0]).toMatchObject(order)
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/orders/merchant')
  })

  it('loginApi：POST /auth/login 返回后端 UserPayload 线格式（nickname + role），而非前端 UserInfo 形状', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        code: 0,
        data: {
          success: true,
          user: { id: 'M001', phone: '13800000000', role: 'owner', nickname: '张商家' },
          token: 'jwt-token'
        },
        message: 'ok'
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await loginApi('13800000000', '1234')

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/auth/login')
    expect(res.success).toBe(true)
    expect(typeof res.token).toBe('string')
    expect(res.user).toMatchObject({ role: 'owner' })
    expect(res.user).toHaveProperty('nickname')
    expect(res.user).not.toHaveProperty('name')
    expect(res.user).not.toHaveProperty('avatar')
  })
})
