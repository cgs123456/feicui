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

// 种水关键词
const waterGradeKeys: string[] = ['玻璃种', '冰种', '糯种', '豆种']

// 场景关键词
const sceneMap: { keys: string[]; scene: string }[] = [
  { keys: ['送礼', '送人', '礼物', '赠送', '送长辈', '送妈妈', '送老婆', '送女友'], scene: '送礼' },
  { keys: ['自用', '自己戴', '日常'], scene: '自用' },
  { keys: ['收藏', '投资', '保值', '升值'], scene: '收藏' }
]

// 风格关键词
const styleMap: { keys: string[]; style: string }[] = [
  { keys: ['圆条', '正圈', '贵妃'], style: '圆条' },
  { keys: ['镶嵌', 'k金', '18k', '白金'], style: '镶嵌' },
  { keys: ['雕件', '雕刻', '观音', '佛公', '弥勒', '如意', '貔貅'], style: '雕件' },
  { keys: ['圆珠', '珠链'], style: '圆珠' }
]

// 偏好标签关键词
const preferenceTags: { keys: string[]; tag: string }[] = [
  { keys: ['高性价比', '便宜', '实惠', '划算'], tag: '高性价比' },
  { keys: ['收藏级', '高端', '顶级', '极品'], tag: '收藏级' },
  { keys: ['送礼佳品', '有面子', '拿得出手'], tag: '送礼佳品' },
  { keys: ['日常佩戴', '百搭', '通勤'], tag: '日常佩戴' }
]

// 用途关键词
const usageMap: { keys: string[]; usage: string }[] = [
  { keys: ['佩戴', '日常'], usage: '日常佩戴' },
  { keys: ['送礼', '送人'], usage: '送礼' },
  { keys: ['收藏', '投资', '保值'], usage: '收藏投资' }
]

/**
 * 解析预算：支持 "5万" "50000" "2.5万" "预算5w" 等格式
 */
export function parseBudget(text: string): number | null {
  const wanMatch = text.match(/(\d+\.?\d*)\s*[万wW]/)
  if (wanMatch) return Math.floor(parseFloat(wanMatch[1]) * 10000)

  const budgetMatch = text.match(/预算\s*(\d+)/)
  if (budgetMatch) {
    const num = parseInt(budgetMatch[1])
    if (num <= 100) return num * 10000
    return num
  }

  const numMatch = text.match(/(\d{4,})/)
  if (numMatch) return parseInt(numMatch[1])

  return null
}

/**
 * 解析用户需求为结构化数据（增强版）
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

  let style: string | null = null
  for (const item of styleMap) {
    if (item.keys.some(k => text.includes(k))) {
      style = item.style
      break
    }
  }

  const sizeMatch = text.match(/(\d+)\s*(mm|cm|圈口|号)/)
  const size = sizeMatch ? sizeMatch[0] : null

  let waterGrade: string | null = null
  for (const w of waterGradeKeys) {
    if (text.includes(w)) {
      waterGrade = w
      break
    }
  }

  let color: string | null = null
  if (text.includes('飘花') || text.includes('蓝花')) {
    color = '飘花'
  } else if (text.includes('绿色') || text.includes('绿')) {
    color = '绿色系'
  } else if (text.includes('紫色') || text.includes('紫')) {
    color = '紫色系'
  } else if (text.includes('红色') || text.includes('红')) {
    color = '红色系'
  } else if (text.includes('黄色') || text.includes('黄')) {
    color = '黄色系'
  } else if (text.includes('无色') || text.includes('透明')) {
    color = '无色透明'
  }

  let usage: string | null = null
  for (const item of usageMap) {
    if (item.keys.some(k => text.includes(k))) {
      usage = item.usage
      break
    }
  }

  const tags: string[] = []
  for (const item of preferenceTags) {
    if (item.keys.some(k => text.includes(k))) {
      tags.push(item.tag)
    }
  }

  return {
    budget,
    category,
    color,
    material,
    waterGrade,
    usage,
    size,
    giftScene,
    keywords: text.split(/\s+/).filter(Boolean),
    style,
    preferenceTags: tags
  }
}

/**
 * 匹配商品并计算推荐分数（增强版）
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

      // 品类匹配 (权重: 25)
      if (requirement.category && product.category === requirement.category) {
        score += 25
        reasons.push(`品类匹配：${requirement.category}`)
      } else if (requirement.category && product.category) {
        // 品类不同但可能相关，给少量分
        score += 3
      }

      // 材质匹配 (权重: 20)
      if (requirement.material && product.material === requirement.material) {
        score += 20
        reasons.push(`${requirement.material}质地`)
      } else if (requirement.material && product.material) {
        score += 2
      }

      // 种水匹配 (权重: 15)
      if (requirement.waterGrade && product.waterGrade && product.waterGrade.includes(requirement.waterGrade)) {
        score += 15
        reasons.push(`种水：${requirement.waterGrade}`)
      } else if (requirement.waterGrade && product.waterGrade) {
        score += 2
      }

      // 颜色匹配 (权重: 10)
      if (requirement.color && product.color && product.color.includes(requirement.color)) {
        score += 10
        reasons.push(`颜色：${requirement.color}`)
      } else if (requirement.color && product.color) {
        score += 2
      }

      // 预算匹配 (权重: 25)
      if (requirement.budget) {
        if (product.price <= requirement.budget) {
          const ratio = product.price / requirement.budget
          if (ratio >= 0.8) {
            score += 25
            reasons.push(`接近预算上限(¥${requirement.budget.toLocaleString()})`)
          } else if (ratio >= 0.5) {
            score += 22
            reasons.push(`符合¥${requirement.budget.toLocaleString()}预算`)
          } else {
            score += 18
            reasons.push(`远低于预算，性价比高`)
          }
        } else if (product.price <= requirement.budget * 1.2) {
          score += 12
          reasons.push(`略超预算(¥${requirement.budget.toLocaleString()})，但品质更优`)
        } else {
          return { product, score: -1, reasons: [] }
        }
      }

      // 风格匹配 (权重: 10)
      if (requirement.style && product.style && product.style.includes(requirement.style)) {
        score += 10
        reasons.push(`风格匹配：${requirement.style}`)
      }

      // 基础分
      if (product.status === 'active') {
        score += 8
      }

      // 场景加分
      if (requirement.giftScene === '送礼' && product.price >= 10000) {
        score += 5
        reasons.push('适合送礼')
      }
      if (requirement.giftScene === '收藏' && product.price >= 50000) {
        score += 6
        reasons.push('收藏级别')
      }
      if (requirement.giftScene === '自用' && product.price <= 50000) {
        score += 5
        reasons.push('适合日常佩戴')
      }

      // 偏好标签加分
      if (requirement.preferenceTags?.includes('高性价比') && product.originalPrice && product.price / product.originalPrice <= 0.8) {
        score += 5
        reasons.push('高性价比之选')
      }
      if (requirement.preferenceTags?.includes('收藏级') && product.price >= 50000) {
        score += 5
        reasons.push('收藏级佳品')
      }
      if (requirement.preferenceTags?.includes('送礼佳品') && product.price >= 20000) {
        score += 5
        reasons.push('送礼体面')
      }

      // 证书加分
      if (product.certificate?.includes('NGTC') || product.certificate?.includes('CNAS')) {
        score += 3
      }

      return { product, score, reasons }
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * 获取 AI 回复文本和推荐商品（增强版）
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
    let reply: string
    if (requirement.budget) {
      reply = `抱歉，在¥${requirement.budget.toLocaleString()}预算内暂未找到${requirement.category || '合适'}的商品。建议适当放宽预算范围，或告诉我其他偏好～`
    } else {
      reply = `抱歉，暂未找到${requirement.category || '合适'}的商品，请尝试其他品类或告诉我更多需求～`
    }
    return { reply, recommendations: [] }
  }

  let productText = ''
  recommendations.forEach((p, idx) => {
    productText += `${idx + 1}. ${p.title}（¥${p.price.toLocaleString()}）`
    if (p.reasons && p.reasons.length > 0) {
      productText += ` — ${p.reasons.join('、')}`
    }
    productText += '\n'
  })

  let reply: string
  if (requirement.budget && requirement.category && requirement.material) {
    let desc = `${requirement.material}${requirement.category}`
    if (requirement.waterGrade) desc = `${requirement.waterGrade}${desc}`
    if (requirement.color) desc = `${requirement.color}${desc}`
    reply = `为您精准匹配到${recommendations.length}款${desc}（¥${requirement.budget.toLocaleString()}预算）：\n\n${productText}\n如需调整参数，请随时告诉我～`
  } else if (requirement.budget && requirement.category) {
    let desc = `${requirement.category}品类`
    if (requirement.waterGrade) desc = `${requirement.waterGrade}${desc}`
    if (requirement.color) desc = `${requirement.color}${desc}`
    reply = `为您找到${recommendations.length}款¥${requirement.budget.toLocaleString()}预算内${desc}商品：\n\n${productText}\n如需调整预算或品类，请随时告诉我～`
  } else if (requirement.budget) {
    let desc = ''
    if (requirement.waterGrade) desc += requirement.waterGrade
    if (requirement.color) desc += requirement.color
    const suffix = desc ? `${desc}的` : ''
    reply = `为您找到${recommendations.length}款¥${requirement.budget.toLocaleString()}预算内${suffix}商品：\n\n${productText}\n如需调整品类或材质，请随时告诉我～`
  } else if (requirement.category) {
    let desc = `${requirement.category}品类`
    if (requirement.waterGrade) desc = `${requirement.waterGrade}${desc}`
    if (requirement.color) desc = `${requirement.color}${desc}`
    reply = `为您找到${desc}优质货源：\n\n${productText}\n您可以告诉我预算范围和偏好，我帮您精准筛选～`
  } else {
    let desc = ''
    if (requirement.waterGrade) desc += requirement.waterGrade
    if (requirement.color) desc += requirement.color
    const suffix = desc ? `${desc}的` : ''
    reply = `为您推荐以下${suffix}热门翡翠商品：\n\n${productText}\n如需更精准匹配，请告诉我您的具体需求（预算、品类、材质、风格等）～`
  }

  return { reply, recommendations }
}