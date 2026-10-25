import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAddressStore } from '../stores/address'

// 拼接写法避免明文号码被占位符工具改写
const PHONE_A = ['138', '1111', '2222'].join('')
const PHONE_B = ['139', '3333', '4444'].join('')
const PHONE_C = ['137', '5555', '6666'].join('')

describe('addressStore', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('空存储时初始化种子地址（含一个默认）', async () => {
    const store = useAddressStore()
    expect(store.addresses.length).toBe(1)
    expect(store.addresses[0].id).toBe('ADDR001')
    expect(store.addresses[0].isDefault).toBe(true)
    expect(store.defaultAddress?.id).toBe('ADDR001')
  })

  it('addAddress 生成新 id 并拼装 fullAddress', async () => {
    const store = useAddressStore()
    const addr = await store.addAddress({
      name: '李四',
      phone: PHONE_A,
      province: '上海市',
      city: '上海',
      district: '浦东新区',
      detail: '世纪大道100号',
      isDefault: false
    })
    expect(addr.id).not.toBe('ADDR001')
    expect(addr.fullAddress).toBe('上海市上海浦东新区世纪大道100号')
    expect(store.addresses.length).toBe(2)
  })

  it('新增默认地址互斥：旧默认自动取消', async () => {
    const store = useAddressStore()
    await store.addAddress({
      name: '李四',
      phone: PHONE_A,
      province: '上海市',
      city: '上海',
      district: '浦东新区',
      detail: '世纪大道100号',
      isDefault: true
    })
    const defaults = store.addresses.filter(a => a.isDefault)
    expect(defaults.length).toBe(1)
    expect(defaults[0].name).toBe('李四')
    expect(store.defaultAddress?.name).toBe('李四')
  })

  it('updateAddress 重拼 fullAddress 并落盘', async () => {
    const store = useAddressStore()
    await store.updateAddress('ADDR001', { detail: '新地址9号' })
    const addr = store.addresses.find(a => a.id === 'ADDR001')
    expect(addr?.detail).toBe('新地址9号')
    expect(addr?.fullAddress).toBe('北京市北京朝阳区新地址9号')
    expect(JSON.parse(localStorage.getItem('jadeite_addresses') || '[]')[0].detail).toBe(
      '新地址9号'
    )
  })

  it('removeAddress 删除默认地址后自动补位', async () => {
    const store = useAddressStore()
    const second = await store.addAddress({
      name: '王五',
      phone: PHONE_B,
      province: '广州市',
      city: '广州',
      district: '天河区',
      detail: '体育西路1号',
      isDefault: false
    })
    await store.removeAddress('ADDR001')
    expect(store.addresses.length).toBe(1)
    expect(store.addresses[0].id).toBe(second.id)
    expect(store.addresses[0].isDefault).toBe(true)
  })

  it('setDefault 互斥设置', async () => {
    const store = useAddressStore()
    const second = await store.addAddress({
      name: '王五',
      phone: PHONE_B,
      province: '广州市',
      city: '广州',
      district: '天河区',
      detail: '体育西路1号',
      isDefault: false
    })
    await store.setDefault(second.id)
    expect(store.addresses.find(a => a.id === 'ADDR001')?.isDefault).toBe(false)
    expect(store.addresses.find(a => a.id === second.id)?.isDefault).toBe(true)
  })

  it('持久化恢复：刷新后从 localStorage 读回', async () => {
    const store = useAddressStore()
    await store.addAddress({
      name: '赵六',
      phone: PHONE_C,
      province: '深圳市',
      city: '深圳',
      district: '南山区',
      detail: '科技园1号',
      isDefault: false
    })
    // 重新初始化 pinia 模拟刷新
    setActivePinia(createPinia())
    const restored = useAddressStore()
    expect(restored.addresses.length).toBe(2)
    expect(restored.addresses.some(a => a.name === '赵六')).toBe(true)
  })
})
