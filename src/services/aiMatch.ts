import type {
  Product,
  UserRequirement,
  MatchResult,
  ProductRecommendation,
  ChatMessage
} from '@/types'
import { formatPrice } from '../utils/format'
import {
  keywordMap,
  materialKeys,
  waterGradeKeys,
  sceneMap,
  styleMap,
  preferenceTags,
  usageMap,
  moreLikeThisKeys,
  cheaperKeys,
  premiumKeys,
  changeCategoryKeys
} from './aiMatch-dictionary'

/**
 * 解析预算：支持 "5万" "50000" "2.5万" "预算5w" 等格式
 */
export function parseBudget(text: string): number | null {
  const raw = parseBudgetRaw(text)
  // 预算 0 / 负值视为未提供有效预算（调用侧统一按 truthy 判断）
  return raw !== null && raw > 0 ? raw : null
}

function parseBudgetRaw(text: string): number | null {
  const wanMatch = text.match(/(\d+\.?\d*)\s*[万wW]/)
  if (wanMatch) return Math.floor(parseFloat(wanMatch[1]) * 10000)

  const budgetMatch = text.match(/预算\s*(\d+)/)
  if (budgetMatch) {
    const num = parseInt(budgetMatch[1], 10)
    if (num <= 100) return num * 10000
    return num
  }

  const numMatch = text.match(/(\d{4,})/)
  if (numMatch) return parseInt(numMatch[1], 10)

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
export function matchProducts(requirement: UserRequirement, products: Product[]): MatchResult[] {
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
      if (
        requirement.waterGrade &&
        product.waterGrade &&
        product.waterGrade.includes(requirement.waterGrade)
      ) {
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
            reasons.push(`接近预算上限(¥${formatPrice(requirement.budget)})`)
          } else if (ratio >= 0.5) {
            score += 22
            reasons.push(`符合¥${formatPrice(requirement.budget)}预算`)
          } else {
            score += 18
            reasons.push(`远低于预算，性价比高`)
          }
        } else if (product.price <= requirement.budget * 1.2) {
          score += 12
          reasons.push(`略超预算(¥${formatPrice(requirement.budget)})，但品质更优`)
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
      if (
        requirement.preferenceTags?.includes('高性价比') &&
        product.originalPrice &&
        product.price / product.originalPrice <= 0.8
      ) {
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
 * 推荐结果 → 卡片映射（getAIResponse 与 getAIResponseWithContext 共用）
 */
function toRecommendations(
  topResults: Array<{ product: Product; score: number; reasons: string[] }>
): ProductRecommendation[] {
  return topResults.map(r => ({
    id: r.product.id,
    cover: r.product.cover,
    title: r.product.title,
    price: r.product.price,
    score: r.score,
    reasons: r.reasons
  }))
}

/**
 * 空结果兜底文案
 */
function buildEmptyReply(requirement: UserRequirement): string {
  if (requirement.budget) {
    return `抱歉，在¥${formatPrice(requirement.budget)}预算内暂未找到${requirement.category || '合适'}的商品。建议适当放宽预算范围，或告诉我其他偏好～`
  }
  return `抱歉，暂未找到${requirement.category || '合适'}的商品，请尝试其他品类或告诉我更多需求～`
}

/**
 * 推荐列表 → 编号文本
 */
function buildProductText(recommendations: ProductRecommendation[]): string {
  let productText = ''
  recommendations.forEach((p, idx) => {
    productText += `${idx + 1}. ${p.title}（¥${formatPrice(p.price)}）`
    if (p.reasons && p.reasons.length > 0) {
      productText += ` — ${p.reasons.join('、')}`
    }
    productText += '\n'
  })
  return productText
}

/**
 * 按需求要素组合回复文案（5 分支，getAIResponse 与 getAIResponseWithContext 共用）
 */
function buildReply(
  requirement: UserRequirement,
  recommendations: ProductRecommendation[]
): string {
  const productText = buildProductText(recommendations)
  const hasBudget = !!requirement.budget
  const hasCategory = !!requirement.category

  if (hasBudget && hasCategory && requirement.material) {
    let desc = `${requirement.material}${requirement.category}`
    if (requirement.waterGrade) desc = `${requirement.waterGrade}${desc}`
    if (requirement.color) desc = `${requirement.color}${desc}`
    return `为您精准匹配到${recommendations.length}款${desc}（¥${formatPrice(requirement.budget)}预算）：\n\n${productText}\n如需调整参数，请随时告诉我～`
  }
  if (hasBudget && hasCategory) {
    let desc = `${requirement.category}品类`
    if (requirement.waterGrade) desc = `${requirement.waterGrade}${desc}`
    if (requirement.color) desc = `${requirement.color}${desc}`
    return `为您找到${recommendations.length}款¥${formatPrice(requirement.budget)}预算内${desc}商品：\n\n${productText}\n如需调整预算或品类，请随时告诉我～`
  }
  if (hasBudget) {
    let desc = ''
    if (requirement.waterGrade) desc += requirement.waterGrade
    if (requirement.color) desc += requirement.color
    const suffix = desc ? `${desc}的` : ''
    return `为您找到${recommendations.length}款¥${formatPrice(requirement.budget)}预算内${suffix}商品：\n\n${productText}\n如需调整品类或材质，请随时告诉我～`
  }
  if (hasCategory) {
    let desc = `${requirement.category}品类`
    if (requirement.waterGrade) desc = `${requirement.waterGrade}${desc}`
    if (requirement.color) desc = `${requirement.color}${desc}`
    return `为您找到${desc}优质货源：\n\n${productText}\n您可以告诉我预算范围和偏好，我帮您精准筛选～`
  }
  let desc = ''
  if (requirement.waterGrade) desc += requirement.waterGrade
  if (requirement.color) desc += requirement.color
  const suffix = desc ? `${desc}的` : ''
  return `为您推荐以下${suffix}热门翡翠商品：\n\n${productText}\n如需更精准匹配，请告诉我您的具体需求（预算、品类、材质、风格等）～`
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
  const recommendations = toRecommendations(results.slice(0, maxResults))

  if (recommendations.length === 0) {
    return { reply: buildEmptyReply(requirement), recommendations: [] }
  }

  return { reply: buildReply(requirement, recommendations), recommendations }
}

/**
 * 从对话历史中提取上一次的 UserRequirement 和已推荐的商品 ID
 */
function extractPreviousContext(history: ChatMessage[]): {
  previousRequirement: UserRequirement | null
  previousRecommendedIds: string[]
} {
  let previousRequirement: UserRequirement | null = null
  const previousRecommendedIds: string[] = []

  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i]
    if (msg.role === 'assistant' && msg.products && msg.products.length > 0) {
      for (const p of msg.products) {
        previousRecommendedIds.push(p.id)
      }
    }
    if (msg.role === 'user' && previousRequirement === null) {
      previousRequirement = parseUserRequirement(msg.content)
    }
    // 找到最近一条用户消息的需求即可
    if (previousRequirement !== null) break
  }

  return { previousRequirement, previousRecommendedIds }
}

/**
 * 判断用户消息是否匹配某个关键词组
 */
function matchesAny(text: string, keys: string[]): boolean {
  return keys.some(k => text.includes(k))
}

/**
 * 多轮对话 AI 回复：结合上下文记忆，支持追问、调整预算、换品类等
 */
export function getAIResponseWithContext(
  userContent: string,
  products: Product[],
  conversationHistory: ChatMessage[],
  maxResults: number = 3
): { reply: string; recommendations: ProductRecommendation[]; parsedRequirement: UserRequirement } {
  const { previousRequirement, previousRecommendedIds } =
    extractPreviousContext(conversationHistory)

  let requirement: UserRequirement
  let excludeIds: string[] = []

  // 判断是否为追问/调整类消息
  if (previousRequirement) {
    if (matchesAny(userContent, moreLikeThisKeys)) {
      // 再推荐几款：沿用上次需求，排除已推荐
      requirement = { ...previousRequirement }
      excludeIds = previousRecommendedIds
    } else if (matchesAny(userContent, cheaperKeys)) {
      // 便宜点：预算降低 30%
      requirement = {
        ...previousRequirement,
        budget: previousRequirement.budget ? Math.floor(previousRequirement.budget * 0.7) : null
      }
    } else if (matchesAny(userContent, premiumKeys)) {
      // 品质好点：预算提高 50%
      requirement = {
        ...previousRequirement,
        budget: previousRequirement.budget ? Math.floor(previousRequirement.budget * 1.5) : null
      }
    } else if (matchesAny(userContent, changeCategoryKeys)) {
      // 换品类：清除品类筛选
      requirement = {
        ...previousRequirement,
        category: null
      }
    } else {
      // 全新消息：正常解析
      requirement = parseUserRequirement(userContent)
    }
  } else {
    // 没有历史上下文，正常解析
    requirement = parseUserRequirement(userContent)
  }

  // 匹配商品
  let results = matchProducts(requirement, products)

  // 排除已推荐的商品
  if (excludeIds.length > 0) {
    results = results.filter(r => !excludeIds.includes(r.product.id))
  }

  const recommendations = toRecommendations(results.slice(0, maxResults))

  if (recommendations.length === 0) {
    return {
      reply: buildEmptyReply(requirement),
      recommendations: [],
      parsedRequirement: requirement
    }
  }

  return {
    reply: buildReply(requirement, recommendations),
    recommendations,
    parsedRequirement: requirement
  }
}
