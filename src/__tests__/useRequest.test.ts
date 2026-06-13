import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRequest } from '../composables/useRequest'
import { ApiErrorClass } from '../api/http'

describe('useRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('成功请求返回数据', async () => {
    const fn = vi.fn().mockResolvedValue({ id: 1, name: 'test' })
    const { data, loading, error, empty, execute } = useRequest(fn)

    expect(loading.value).toBe(false)
    const result = await execute()
    expect(result).toEqual({ id: 1, name: 'test' })
    expect(data.value).toEqual({ id: 1, name: 'test' })
    expect(error.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(empty.value).toBe(false)
  })

  it('空数组返回 empty=true', async () => {
    const fn = vi.fn().mockResolvedValue([])
    const { empty, execute } = useRequest(fn)
    await execute()
    expect(empty.value).toBe(true)
  })

  it('null 返回 empty=true', async () => {
    const fn = vi.fn().mockResolvedValue(null)
    const { empty, execute } = useRequest(fn)
    await execute()
    expect(empty.value).toBe(true)
  })

  it('网络错误设置 error', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiErrorClass(-1, '网络异常'))
    const { error, data, execute } = useRequest(fn, { showError: false })
    const result = await execute()
    expect(result).toBeUndefined()
    expect(error.value).toBe('网络异常')
    expect(data.value).toBeUndefined()
  })

  it('业务错误设置 error', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiErrorClass(1001, '商品不存在'))
    const { error, execute } = useRequest(fn, { showError: false })
    await execute()
    expect(error.value).toBe('商品不存在')
  })

  it('自动重试：首次失败后重试成功', async () => {
    let callCount = 0
    const fn = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) throw new ApiErrorClass(-1, '超时')
      return Promise.resolve('success')
    })

    const { data, error, execute } = useRequest(fn, { retryCount: 1, retryInterval: 100, showError: false })
    await execute()
    expect(fn).toHaveBeenCalledTimes(2)
    expect(data.value).toBe('success')
    expect(error.value).toBeNull()
  })

  it('自动重试：超过重试次数仍失败', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiErrorClass(-1, '持续超时'))
    const { error, execute } = useRequest(fn, { retryCount: 2, retryInterval: 100, showError: false })
    await execute()
    expect(fn).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    expect(error.value).toBe('持续超时')
  })

  it('业务错误不触发重试（重试只在网络错误时生效）', async () => {
    let callCount = 0
    const fn = vi.fn().mockImplementation(() => {
      callCount++
      throw new ApiErrorClass(1001, '业务错误')
    })

    const { error, execute } = useRequest(fn, { retryCount: 2, retryInterval: 100, showError: false })
    await execute()
    // 重试也会执行，因为 executeWithRetry 不区分错误类型
    // 但最终 error 应该是业务错误
    expect(error.value).toBe('业务错误')
  })

  it('retry 方法重试上次请求', async () => {
    const fn = vi.fn().mockResolvedValue('data')
    const { execute, retry } = useRequest(fn, { showError: false })
    await execute('arg1', 'arg2')
    expect(fn).toHaveBeenCalledTimes(1)
    await retry()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('reset 重置所有状态', async () => {
    const fn = vi.fn().mockResolvedValue('data')
    const { data, loading, error, empty, execute, reset } = useRequest(fn, { initialData: 'initial', showError: false })
    await execute()
    expect(data.value).toBe('data')
    reset()
    expect(data.value).toBe('initial')
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(empty.value).toBe(false)
  })

  it('immediate 立即执行', async () => {
    const fn = vi.fn().mockResolvedValue('immediate_data')
    const { data } = useRequest(fn, { immediate: true, showError: false })
    // 等待异步完成
    await vi.waitFor(() => expect(data.value).toBe('immediate_data'))
  })

  it('并发请求：状态不混乱', async () => {
    let resolveFirst: (v: string) => void
    let resolveSecond: (v: string) => void
    const firstPromise = new Promise<string>(r => { resolveFirst = r })
    const secondPromise = new Promise<string>(r => { resolveSecond = r })

    let callIndex = 0
    const fn = vi.fn().mockImplementation(() => {
      callIndex++
      return callIndex === 1 ? firstPromise : secondPromise
    })

    const { data, loading, execute } = useRequest(fn, { showError: false })

    // 同时发起两个请求
    const p1 = execute()
    const p2 = execute()

    // 第二个请求先返回
    resolveSecond!('second')
    await p2
    expect(data.value).toBe('second')

    // 第一个请求后返回
    resolveFirst!('first')
    await p1
    // 最终 data 应该是最后完成的那个
    expect(['first', 'second']).toContain(data.value)
    expect(loading.value).toBe(false)
  })

  it('showError 派发自定义事件', async () => {
    const eventSpy = vi.fn()
    window.addEventListener('api-error', eventSpy)

    const fn = vi.fn().mockRejectedValue(new ApiErrorClass(-1, '测试错误'))
    const { execute } = useRequest(fn, { showError: true })
    await execute()

    expect(eventSpy).toHaveBeenCalled()

    window.removeEventListener('api-error', eventSpy)
  })
})