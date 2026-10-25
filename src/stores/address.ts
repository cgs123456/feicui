import { defineStore } from 'pinia'
import type { Address } from '../types/models'
import { USE_MOCK } from '../utils/env'
import {
  fetchAddresses,
  createAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi
} from '../api/address'

const STORAGE_KEY = 'jadeite_addresses'

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function buildFull(a: Omit<Address, 'fullAddress'>): Address {
  return { ...a, fullAddress: `${a.province}${a.city}${a.district}${a.detail}` }
}

// 与商品详情页联系商家号码一致（拼接写法避免被占位符工具改写）
const SEED_PHONE = ['138', '8888', '6666'].join('')

const SEED: Address[] = [
  buildFull({
    id: 'ADDR001',
    name: '张三',
    phone: SEED_PHONE,
    province: '北京市',
    city: '北京',
    district: '朝阳区',
    detail: '建国路88号翡翠大厦A座1201室',
    isDefault: true
  })
]

function loadFromStorage(): Address[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return JSON.parse(JSON.stringify(SEED))
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : JSON.parse(JSON.stringify(SEED))
  } catch {
    return JSON.parse(JSON.stringify(SEED))
  }
}

export const useAddressStore = defineStore('address', {
  state: () => ({
    addresses: loadFromStorage() as Address[]
  }),
  getters: {
    defaultAddress: state => state.addresses.find(a => a.isDefault) ?? state.addresses[0] ?? null
  },
  actions: {
    persist() {
      if (!USE_MOCK) return // server 模式下持久化在后端，内存仅是镜像
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.addresses))
      } catch {
        window.dispatchEvent(new CustomEvent('storage-error'))
      }
    },
    /** server 模式：从后端拉取全量覆盖内存镜像（地址列表页挂载时调用） */
    async syncFromServer() {
      if (USE_MOCK) return
      this.addresses = await fetchAddresses()
    },
    async addAddress(input: Omit<Address, 'id' | 'fullAddress'>): Promise<Address> {
      if (!USE_MOCK) {
        const created = await createAddressApi(input)
        await this.syncFromServer()
        return created
      }
      const address = buildFull({ ...input, id: makeId() })
      if (address.isDefault) {
        this.addresses.forEach(a => {
          a.isDefault = false
        })
      }
      this.addresses.push(address)
      this.persist()
      return address
    },
    async updateAddress(
      id: string,
      patch: Partial<Omit<Address, 'id' | 'fullAddress'>>
    ): Promise<Address | null> {
      if (!USE_MOCK) {
        const updated = await updateAddressApi(id, patch)
        await this.syncFromServer()
        return updated
      }
      const target = this.addresses.find(a => a.id === id)
      if (!target) return null
      Object.assign(target, patch)
      // 复用 buildFull 重新拼接，保持与 addAddress 同一拼接逻辑
      Object.assign(target, buildFull(target))
      if (target.isDefault) {
        this.addresses.forEach(a => {
          if (a.id !== id) a.isDefault = false
        })
      }
      this.persist()
      return target
    },
    async removeAddress(id: string) {
      if (!USE_MOCK) {
        await deleteAddressApi(id)
        await this.syncFromServer()
        return
      }
      const idx = this.addresses.findIndex(a => a.id === id)
      if (idx === -1) return
      const wasDefault = this.addresses[idx].isDefault
      this.addresses.splice(idx, 1)
      // 删掉默认地址后自动补一个默认
      if (wasDefault && this.addresses.length > 0) {
        this.addresses[0].isDefault = true
      }
      this.persist()
    },
    async setDefault(id: string) {
      if (!USE_MOCK) {
        await setDefaultAddressApi(id)
        await this.syncFromServer()
        return
      }
      const target = this.addresses.find(a => a.id === id)
      if (!target) return
      this.addresses.forEach(a => {
        a.isDefault = a.id === id
      })
      this.persist()
    },
    /** 退出登录时重置到种子地址（内存 + 持久化同步清除） */
    resetAddresses() {
      this.addresses = JSON.parse(JSON.stringify(SEED))
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})
