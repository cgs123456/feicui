import { computed } from 'vue'

export interface ConversionInput {
  status?: string
  tags?: string[]
}

/**
 * 成交概率评分（客户模块共用规则）：
 * 已成交=100；跟进中按意向标签分档（高意向 75 / 批发 60 / 意向中 50 / 有成交史 85 / 默认 35）；其余 20
 */
export function useConversionScore(source: () => ConversionInput | null | undefined) {
  const conversionProbability = computed(() => {
    const c = source()
    if (!c) return 0
    const status = c.status || ''
    const tags: string[] = c.tags || []

    if (status === '已成交') return 100
    if (status === '跟进中') {
      if (tags.some((t: string) => t.includes('高意向') || t.includes('意向高'))) return 75
      if (tags.some((t: string) => t.includes('意向中'))) return 50
      if (tags.some((t: string) => t.includes('批发'))) return 60
      if (tags.some((t: string) => t.includes('已成交'))) return 85
      return 35
    }
    return 20
  })

  /** 概率 → 样式分档（≥70 高 / ≥40 中 / 其余低） */
  const probabilityClass = computed((): 'prob-high' | 'prob-mid' | 'prob-low' => {
    const p = conversionProbability.value
    if (p >= 70) return 'prob-high'
    if (p >= 40) return 'prob-mid'
    return 'prob-low'
  })

  return { conversionProbability, probabilityClass }
}
