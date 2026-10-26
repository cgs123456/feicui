import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAddressStore } from '../stores/address'
import type { Address } from '../types'

vi.mock('../api/address', () => ({
  fetchAddresses: vi.fn(),
  createAddressApi: vi.fn(),
  updateAddressApi: vi.fn(),
  deleteAddressApi: vi.fn(),
  setDefaultAddressApi: vi.fn()
}))

import {
  fetchAddresses,
  createAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi
} from '../api/address'

const mockedFetch = vi.mocked(fetchAddresses)
const mockedCreate = vi.mocked(createAddressApi)
const mockedUpdate = vi.mocked(updateAddressApi)
const mockedDelete = vi.mocked(deleteAddressApi)
const mockedSetDefault = vi.mocked(setDefaultAddressApi)

function makeAddress(over: Partial<Address> = {}): Address {
  return {
    id: 'ADDR001',
    name: '张三',
    phone: '13800000000',
    province: '北京市',
    city: '北京',
    district: '朝阳区',
    detail: '建国路88号',
    fullAddress: '北京市北京朝阳区建国路88号',
    isDefault: true,
    ...over
  } as Address
}

describe('addressStore（server 模式：后端为唯一数据源）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('syncFromServer 拉取后端全量覆盖镜像', async () => {
    const store = useAddressStore()
    mockedFetch.mockResolvedValue([makeAddress()])

    await store.syncFromServer()

    expect(store.addresses).toHaveLength(1)
    expect(store.addresses[0].id).toBe('ADDR001')
  })

  it('defaultAddress 返回 isDefault 项，没有默认时退回第一条', async () => {
    const store = useAddressStore()
    store.addresses = [makeAddress({ id: 'A1', isDefault: false }), makeAddress({ id: 'A2' })]
    expect(store.defaultAddress?.id).toBe('A2')
    store.addresses = [makeAddress({ id: 'A1', isDefault: false })]
    expect(store.defaultAddress?.id).toBe('A1')
    store.addresses = []
    expect(store.defaultAddress).toBeNull()
  })

  it('addAddress 调后端创建并刷新镜像', async () => {
    const store = useAddressStore()
    const created = makeAddress({ id: 'ADDR002' })
    mockedCreate.mockResolvedValue(created)
    mockedFetch.mockResolvedValue([makeAddress(), created])

    const result = await store.addAddress({
      name: '李四',
      phone: '13900000000',
      province: '上海市',
      city: '上海',
      district: '浦东新区',
      detail: 'xx路1号',
      isDefault: false
    } as Address)

    expect(result.id).toBe('ADDR002')
    expect(mockedFetch).toHaveBeenCalledTimes(1)
    expect(store.addresses).toHaveLength(2)
  })

  it('updateAddress 调后端部分更新并刷新镜像', async () => {
    const store = useAddressStore()
    const updated = makeAddress({ detail: '新地址' })
    mockedUpdate.mockResolvedValue(updated)
    mockedFetch.mockResolvedValue([updated])

    const result = await store.updateAddress('ADDR001', { detail: '新地址' })

    expect(mockedUpdate).toHaveBeenCalledWith('ADDR001', { detail: '新地址' })
    expect(result?.detail).toBe('新地址')
    expect(store.addresses[0].detail).toBe('新地址')
  })

  it('removeAddress 调后端删除并刷新镜像', async () => {
    const store = useAddressStore()
    store.addresses = [makeAddress()]
    mockedDelete.mockResolvedValue({ success: true })
    mockedFetch.mockResolvedValue([])

    await store.removeAddress('ADDR001')

    expect(mockedDelete).toHaveBeenCalledWith('ADDR001')
    expect(store.addresses).toHaveLength(0)
  })

  it('setDefault 调后端设默认并刷新镜像', async () => {
    const store = useAddressStore()
    mockedSetDefault.mockResolvedValue({ success: true })
    mockedFetch.mockResolvedValue([makeAddress({ id: 'A1', isDefault: false }), makeAddress()])

    await store.setDefault('ADDR001')

    expect(mockedSetDefault).toHaveBeenCalledWith('ADDR001')
    expect(store.addresses.find(a => a.id === 'ADDR001')?.isDefault).toBe(true)
  })
})
