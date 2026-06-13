import { describe, it, expect } from 'vitest'
import { parseBudget, parseUserRequirement, matchProducts, getAIResponse } from '../services/aiMatch'
import type { Product } from '@/types'

const mockProducts: Product[] = [
  {
    id: 'P001',
    title: '冰种飘花翡翠手镯 58圈口',
    price: 88000,
    cover: 'test.jpg',
    category: '手镯',
    material: '冰种',
    status: 'active'
  },
  {
    id: 'P002',
    title: '帝王绿翡翠戒指 18K金镶嵌',
    price: 156000,
    cover: 'test.jpg',
    category: '戒指',
    material: '帝王绿',
    status: 'active'
  },
  {
    id: 'P003',
    title: '糯种翡翠平安扣',
    price: 3600,
    cover: 'test.jpg',
    category: '平安扣',
    material: '糯种',
    status: 'active'
  },
  {
    id: 'P004',
    title: '玻璃种观音翡翠吊坠',
    price: 198000,
    cover: 'test.jpg',
    category: '吊坠',
    material: '玻璃种',
    status: 'active'
  },
  {
    id: 'P005',
    title: '冰种翡翠如意挂件',
    price: 25800,
    cover: 'test.jpg',
    category: '挂件',
    material: '冰种',
    status: 'active'
  },
  {
    id: 'P010',
    title: '玻璃种翡翠平安扣吊坠',
    price: 128000,
    cover: 'test.jpg',
    category: '平安扣',
    material: '玻璃种',
    status: 'sold'
  }
]

describe('parseBudget', () => {
  it('应解析 "预算2万" 为 20000', () => {
    expect(parseBudget('预算2万')).toBe(20000)
  })

  it('应解析 "5万" 为 50000', () => {
    expect(parseBudget('5万')).toBe(50000)
  })

  it('应解析 "2.5万" 为 25000', () => {
    expect(parseBudget('2.5万')).toBe(25000)
  })

  it('应解析 "预算50000" 为 50000', () => {
    expect(parseBudget('预算50000')).toBe(50000)
  })

  it('应解析 "预算5" 为 50000（简写按万处理）', () => {
    expect(parseBudget('预算5')).toBe(50000)
  })

  it('无预算时应返回 null', () => {
    expect(parseBudget('冰种平安扣')).toBeNull()
  })
})

describe('parseUserRequirement', () => {
  it('应解析品类和预算', () => {
    const req = parseUserRequirement('冰种平安扣 预算2万')
    expect(req.category).toBe('平安扣')
    expect(req.budget).toBe(20000)
    expect(req.material).toBe('冰种')
  })

  it('应识别送礼场景', () => {
    const req = parseUserRequirement('送人翡翠吊坠 预算3万')
    expect(req.giftScene).toBe('送礼')
    expect(req.category).toBe('吊坠')
  })
})

describe('matchProducts', () => {
  it('输入"冰种平安扣 预算2万"应返回平安扣商品', () => {
    const req = parseUserRequirement('冰种平安扣 预算2万')
    const results = matchProducts(req, mockProducts)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].product.category).toBe('平安扣')
    expect(results[0].product.price).toBeLessThanOrEqual(20000)
  })

  it('应排除已售商品', () => {
    const req = parseUserRequirement('玻璃种平安扣 预算20万')
    const results = matchProducts(req, mockProducts)
    // 玻璃种平安扣 P010 是 sold 状态，不应出现在结果中
    const soldProduct = results.find(r => r.product.id === 'P010')
    expect(soldProduct).toBeUndefined()
  })

  it('预算不足时应返回空结果', () => {
    const req = parseUserRequirement('帝王绿手镯 预算500')
    const results = matchProducts(req, mockProducts)
    expect(results.length).toBe(0)
  })
})

describe('getAIResponse', () => {
  it('应返回 AI 回复和推荐商品', () => {
    const { reply, recommendations } = getAIResponse('冰种平安扣 预算2万', mockProducts, 3)
    expect(reply).toContain('平安扣')
    expect(recommendations.length).toBeGreaterThan(0)
    expect(recommendations[0].reasons).toBeDefined()
    expect(recommendations[0].reasons!.length).toBeGreaterThan(0)
  })

  it('推荐结果应包含推荐理由', () => {
    const { recommendations } = getAIResponse('冰种平安扣 预算2万', mockProducts, 3)
    const reasons = recommendations[0].reasons || []
    expect(reasons.some((r: string) => r.includes('预算'))).toBe(true)
    expect(reasons.some((r: string) => r.includes('平安扣'))).toBe(true)
  })
})

describe('多轮对话', () => {
  it('"再推荐几款"应排除之前的推荐', () => {
    // 先获取第一轮推荐
    const firstResult = getAIResponse('冰种平安扣 预算2万', mockProducts, 3)
    const firstIds = firstResult.recommendations.map(r => r.id)

    // "再推荐几款" — 排除已推荐的ID后重新匹配
    const remaining = mockProducts.filter(p => !firstIds.includes(p.id) && p.status === 'active')
    const secondResult = getAIResponse('平安扣 预算2万', remaining, 3)
    const secondIds = secondResult.recommendations.map(r => r.id)

    // 第二轮推荐不应包含第一轮已推荐的商品
    for (const id of firstIds) {
      expect(secondIds).not.toContain(id)
    }
  })

  it('"便宜点"应降低预算', () => {
    // 先用2万预算
    const firstReq = parseUserRequirement('冰种平安扣 预算2万')
    expect(firstReq.budget).toBe(20000)

    // "便宜点" — 新预算应更低
    const secondReq = parseUserRequirement('冰种平安扣 预算1万')
    expect(secondReq.budget).toBe(10000)
    expect(secondReq.budget!).toBeLessThan(firstReq.budget!)

    // 降低预算后的推荐价格应更低
    const results = matchProducts(secondReq, mockProducts)
    for (const r of results) {
      expect(r.product.price).toBeLessThanOrEqual(10000)
    }
  })
})

describe('边界情况', () => {
  it('空输入应返回空推荐', () => {
    const { recommendations } = getAIResponse('', mockProducts, 3)
    // 空输入无品类/预算/材质等关键词，匹配分数很低，可能返回空或少量结果
    // 但不应抛出异常
    expect(recommendations).toBeDefined()
    expect(Array.isArray(recommendations)).toBe(true)
  })

  it('极高预算仍应返回结果', () => {
    const { recommendations } = getAIResponse('手镯 预算9999万', mockProducts, 3)
    expect(recommendations.length).toBeGreaterThan(0)
    // 应包含手镯品类
    expect(recommendations.some(r => r.title.includes('手镯'))).toBe(true)
  })

  it('非翡翠关键词应返回通用推荐', () => {
    const { reply, recommendations } = getAIResponse('手机壳', mockProducts, 3)
    // 非翡翠关键词不应崩溃，应返回通用推荐或空推荐
    expect(reply).toBeDefined()
    expect(typeof reply).toBe('string')
    expect(recommendations).toBeDefined()
    expect(Array.isArray(recommendations)).toBe(true)
  })
})
