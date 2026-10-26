/**
 * 地址接口层：与 server/src/routes/addresses.ts 契约一一对应。
 */
import type { Address } from '@/types'
import { http } from './http'

export type AddressPayload = {
  name?: string
  phone?: string
  province?: string
  city?: string
  district?: string
  detail?: string
  isDefault?: boolean
}

export async function fetchAddresses(): Promise<Address[]> {
  const res = await http.get<Address[]>('/addresses')
  return res.data
}

export async function createAddressApi(payload: AddressPayload): Promise<Address> {
  const res = await http.post<Address>('/addresses', payload)
  return res.data
}

export async function updateAddressApi(id: string, payload: AddressPayload): Promise<Address> {
  const res = await http.put<Address>(`/addresses/${id}`, payload)
  return res.data
}

export async function deleteAddressApi(id: string): Promise<{ success: boolean }> {
  const res = await http.delete<{ success: boolean }>(`/addresses/${id}`)
  return res.data
}

export async function setDefaultAddressApi(id: string): Promise<{ success: boolean }> {
  const res = await http.post<{ success: boolean }>(`/addresses/${id}/default`)
  return res.data
}
