// 发布页常量：步骤、选择器选项与发布/标题优化用映射

export const publishSteps = ['上传图片', '填写信息', 'AI生成', '发布']

export const categoryColumns = [
  { text: '手镯', value: '手镯' },
  { text: '戒指', value: '戒指' },
  { text: '吊坠', value: '吊坠' },
  { text: '挂件', value: '挂件' },
  { text: '项链', value: '项链' },
  { text: '平安扣', value: '平安扣' },
  { text: '手链', value: '手链' },
  { text: '耳饰', value: '耳饰' }
]

export const materialColumns = [
  { text: '玻璃种', value: '玻璃种' },
  { text: '冰种', value: '冰种' },
  { text: '糯种', value: '糯种' },
  { text: '帝王绿', value: '帝王绿' },
  { text: '紫罗兰', value: '紫罗兰' },
  { text: '飘花', value: '飘花' },
  { text: '黄翡', value: '黄翡' },
  { text: '红翡', value: '红翡' }
]

// AI标题优化：材质 → 证书机构
export const titleCertMap: Record<string, string> = {
  玻璃种: 'NGTC国检',
  帝王绿: 'CNAS国际互认',
  冰种: '省级鉴定',
  糯种: '省级鉴定'
}

// 发布：材质 → 展示重量
export const materialWeightMap: Record<string, string> = {
  玻璃种: '约22g',
  冰种: '约18g',
  糯种: '约35g',
  帝王绿: '约12g',
  紫罗兰: '约30g',
  飘花: '约25g',
  黄翡: '约20g',
  红翡: '约20g'
}

// 发布：品类 → 款式
export const categoryStyleMap: Record<string, string> = {
  手镯: '圆条',
  戒指: '镶嵌戒指',
  吊坠: '雕件',
  挂件: '挂件',
  项链: '项链',
  平安扣: '平安扣',
  手链: '手链',
  耳饰: '耳饰'
}

// 发布：材质 → 证书文案
export const publishCertMap: Record<string, string> = {
  玻璃种: 'NGTC国检证书',
  帝王绿: 'CNAS国际互认证书',
  冰种: '省级鉴定证书'
}
