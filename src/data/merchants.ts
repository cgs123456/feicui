/** 平台商家名录：C 端详情页联系商家、B 端数据隔离共用 */
export interface MerchantInfo {
  id: string
  name: string
  /** 展示格式，如 138-8888-6666 */
  phoneDisplay: string
  /** 拨号格式（纯数字，供 tel: 链接） */
  phoneTel: string
  wechat: string
  /** 营业时间 */
  businessHours: string
}

const M001_TEL = ['138', '8888', '6666']
const M002_TEL = ['139', '5566', '7788']
const M003_TEL = ['137', '2233', '4455']

export const MERCHANTS: Record<string, MerchantInfo> = {
  M001: {
    id: 'M001',
    name: '翡翠源珠宝',
    phoneDisplay: M001_TEL.join('-'),
    phoneTel: M001_TEL.join(''),
    wechat: 'jadeite_shop',
    businessHours: '09:00 - 21:00'
  },
  M002: {
    id: 'M002',
    name: '瑞丽翠语阁',
    phoneDisplay: M002_TEL.join('-'),
    phoneTel: M002_TEL.join(''),
    wechat: 'ruili_cuiyu',
    businessHours: '09:30 - 20:30'
  },
  M003: {
    id: 'M003',
    name: '揭阳阳美翠轩',
    phoneDisplay: M003_TEL.join('-'),
    phoneTel: M003_TEL.join(''),
    wechat: 'yangmei_xuan',
    businessHours: '10:00 - 21:30'
  }
}

export const DEFAULT_MERCHANT_ID = 'M001'

export function getMerchantInfo(id?: string): MerchantInfo {
  return (id && MERCHANTS[id]) || MERCHANTS[DEFAULT_MERCHANT_ID]
}
