import { defineStore } from 'pinia'
import type { Address } from '../types/models'
import {
  fetchAddresses,
  createAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi
} from '../api/address'

export const useAddressStore = defineStore('address', {
  state: () => ({
    // 后端是唯一数据源：内存列表仅是镜像，进入页面时通过 syncFromServer 拉取
    addresses: [] as Address[]
  }),
  getters: {
    defaultAddress: state => state.addresses.find(a => a.isDefault) ?? state.addresses[0] ?? null
  },
  actions: {
    /** 从后端拉取全量地址覆盖内存镜像（地址列表页挂载时调用） */
    async syncFromServer() {
      this.addresses = await fetchAddresses()
    },
    async addAddress(input: Omit<Address, 'id' | 'fullAddress'>): Promise<Address> {
      const created = await createAddressApi(input)
      await this.syncFromServer()
      return created
    },
    async updateAddress(
      id: string,
      patch: Partial<Omit<Address, 'id' | 'fullAddress'>>
    ): Promise<Address | null> {
      const updated = await updateAddressApi(id, patch)
      await this.syncFromServer()
      return updated
    },
    async removeAddress(id: string) {
      await deleteAddressApi(id)
      await this.syncFromServer()
    },
    async setDefault(id: string) {
      await setDefaultAddressApi(id)
      await this.syncFromServer()
    },
    /** 退出登录时清空镜像（登录后由 syncFromServer 重新拉取） */
    resetAddresses() {
      this.addresses = []
    }
  }
})
