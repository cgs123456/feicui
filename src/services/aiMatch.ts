import type { Product, UserRequirement, MatchResult, ProductRecommendation } from '@/types'

// 品类关键词映射
const keywordMap: { keys: string[]; cat: string }[] = [
  { keys: ['手镯', '手环', '镯子'], cat: '手镯' },
  { keys: ['戒指', '戒面', '指环'], cat: '戒指' },
  { keys: ['吊坠', '挂件', '挂坠'], cat: '吊坠' },
  { keys: ['平安扣'], cat: '平安扣' },
  { keys: ['项链', '项圈', '珠子', '颈链'], cat: '项链' }
]

// 材质关键词
const materialKeys: string[] = ['玻璃种', '冰种', '糯种', '帝王绿', '紫罗兰', '飘花', '黄翡', '红翡']

// 场景关键词
const sceneMap: { keys: string[]; scene: string }[] = [
  { keys: ['送礼', '送人', '礼物', '赠送'], scene: '送礼' },
  { keys: ['自用', '自己戴', '日常'], scene: '自用' },
  { keys: ['收藏', '投资', '保值'], scene: '收藏' }
]

/**
 * 解析预算：支持 "5万" "50000" "2.5万" "预算5w" 等格式
 */
export function parseBudget(text: string): number | null {
  // 匹配 "X万" 或 "X.X万" 或 "Xw" 或 "XW"
  const wanMatch = text.match(/(\d+\.?\d*)\s*[万wW]/)
  if (wanMatch) return Math.floor(parseFloat(wanMatch[1]) * 10000)

  // 匹配 "预算X" 或 "预算 X" 后面跟纯数字
  const budgetMatch = text.match(/预算\s*(\d+)/)
  if (budgetMatch) {
    const num = parseInt(budgetMatch[1])
    if (num <= 100) return num * 10000
    return num
  }

  // 匹配纯数字（至少4位，如 50000）
  const numMatch = text.match(/(\d{4,})/)
  if (numMatch) return parseInt(numMatch[1])

  return null
}

/**
 * 解析用户需求为结构化数据
 */
export function parseUserRequirement(text: string): UserRequirement {
  const budget = parseBudget(text)

  let category: string | null = null
  for (const item of keywordMap) {
    if (item.keys.some(k => text.includes(k))) {
      category = item.cat
      break
    }
  }

  let material: string | null = null
  for (const m of materialKeys) {
    if (text.includes(m)) {
      material = m
      break
    }
  }

  let giftScene: string | null = null
  for (const item of sceneMap) {
    if (item.keys.some(k => text.includes(k))) {
      giftScene = item.scene
      break
    }
  }

  // 提取尺寸
  const sizeMatch = text.match(/(\d+)\s*(mm|cm|圈口|号)/)
  const size = sizeMatch ? sizeMatch[0] : null

  // 提取颜色
  let color: string | null = null
  if (text.includes('绿')) color = '绿色系'
  if (text.includes('紫')) color = '紫色系'
  if (text.includes('红')) color = '红色系'
  if (text.includes('黄')) color = '黄色系'
  if (text.includes('白') || text.includes('无色')) color = '无色系'

  return {
    budget,
    category,
    color,
    material,
    usage: null,
    size,
    giftScene,
    keywords: text.split(/\s+/).filter(Boolean)
  }
}

/**
 * 匹配商品并计算推荐分数
 */
export function matchProducts(
  requirement: UserRequirement,
  products: Product[]
): MatchResult[] {
  return products
    .filter(p => p.status === 'active')
    .map(product => {
      let score = 0
      const reasons: string[] = []

      // 品类匹配 (权重: 30)
      if (requirement.category && product.category === requirement.category) {
        score += 30
        reasons.push(`品类为${requirement.category}`)
      }

      // 材质匹配 (权重: 20)
      if (requirement.material && product.material === requirement.material) {
        score += 20
        reasons.push(`${requirement.material}质地`)
      }

      // 预算匹配 (权重: 25)
      if (requirement.budget) {
        if (product.price <= requirement.budget) {
          score += 25
          reasons.push(`符合¥${requirement.budget.toLocaleString()}预算`)
        } else if (product.price <= requirement.budget * 1.2) {
          score += 10
          reasons.push(`接近¥${requirement.budget.toLocaleString()}预算`)
        } else {
          // 超出预算太多，直接排除
          return { product, score: -1, reasons: [] }
        }
      }

      // 基础分：有库存的在售商品
      if (product.status === 'active') {
        score += 10
      }

      // 场景加分
      if (requirement.giftScene === '送礼' && product.price >= 10000) {
        score += 5
        reasons.push('适合送礼')
      }
      if (requirement.giftScene === '收藏' && product.price >= 50000) {
        score += 5
        reasons.push('收藏级别')
      }
      if (requirement.giftScene === '自用' && product.price <= 50000) {
        score += 5
        reasons.push('适合日常佩戴')
      }

      return { product, score, reasons }
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * 获取 AI 回复文本和推荐商品
 */
export function getAIResponse(
  userContent: string,
  products: Product[],
  maxResults: number = 3
): { reply: string; recommendations: ProductRecommendation[] } {
  const requirement = parseUserRequirement(userContent)
  const results = matchProducts(requirement, products)
  const topResults = results.slice(0, maxResults)

  const recommendations: ProductRecommendation[] = topResults.map(r => ({
    id: r.product.id,
    cover: r.product.cover,
    title: r.product.title,
    price: r.product.price,
    score: r.score,
    reasons: r.reasons
  }))

  if (recommendations.length === 0) {
    const reply = requirement.budget
      ? `抱歉，在¥${requirement.budget.toLocaleString()}预算内暂未找到${requirement.category || '合适'}的商品。建议适当放宽预算范围，或告诉我其他偏好～`
      : `抱歉，暂未找到${requirement.category || '合适'}的商品，请尝试其他品类～`
    return { reply, recommendations: [] }
  }

  // 构建推荐列表
  let productText = ''
  recommendations.forEach((p, idx) => {
    productText += `${idx + 1}. ${p.title}（¥${p.price.toLocaleString()}）`
    if (p.reasons && p.reasons.length > 0) {
      productText += ` — ${p.reasons.join('、')}`
    }
    productText += '\n'
  })

  let reply: string
  if (requirement.budget && requirement.category) {
    reply = `为您找到${recommendations.length}款¥${requirement.budget.toLocaleString()}预算内${requirement.category}品类商品：\n\n${productText}\n如需调整预算或品类，请随时告诉我～`
  } else if (requirement.budget) {
    reply = `为您找到${recommendations.length}款¥${requirement.budget.toLocaleString()}预算内商品：\n\n${productText}\n如需调整品类，请随时告诉我～`
  } else if (requirement.category) {
    reply = `为您找到${requirement.category}品类优质货源：\n\n${productText}\n您可以告诉我预算范围，我帮您精准筛选～`
  } else {
    reply = `为您推荐以下热门翡翠商品：\n\n${productText}\n如需更精准匹配，请告诉我您的具体需求（预算、品类、尺寸等）～`
  }

  return { reply, recommendations }
}