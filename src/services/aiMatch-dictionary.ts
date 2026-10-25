// AI 匹配服务的关键词与映射字典（从 aiMatch.ts 拆出，仅数据，无逻辑）

// 品类关键词映射
export const keywordMap: { keys: string[]; cat: string }[] = [
  { keys: ['手镯', '手环', '镯子'], cat: '手镯' },
  { keys: ['戒指', '戒面', '指环'], cat: '戒指' },
  { keys: ['吊坠', '挂件', '挂坠'], cat: '吊坠' },
  { keys: ['平安扣'], cat: '平安扣' },
  { keys: ['项链', '项圈', '珠子', '颈链'], cat: '项链' }
]

// 材质关键词
export const materialKeys: string[] = [
  '玻璃种',
  '冰种',
  '糯种',
  '帝王绿',
  '紫罗兰',
  '飘花',
  '黄翡',
  '红翡'
]

// 种水关键词
export const waterGradeKeys: string[] = ['玻璃种', '冰种', '糯种', '豆种']

// 场景关键词
export const sceneMap: { keys: string[]; scene: string }[] = [
  { keys: ['送礼', '送人', '礼物', '赠送', '送长辈', '送妈妈', '送老婆', '送女友'], scene: '送礼' },
  { keys: ['自用', '自己戴', '日常'], scene: '自用' },
  { keys: ['收藏', '投资', '保值', '升值'], scene: '收藏' }
]

// 风格关键词
export const styleMap: { keys: string[]; style: string }[] = [
  { keys: ['圆条', '正圈', '贵妃'], style: '圆条' },
  { keys: ['镶嵌', 'k金', '18k', '白金'], style: '镶嵌' },
  { keys: ['雕件', '雕刻', '观音', '佛公', '弥勒', '如意', '貔貅'], style: '雕件' },
  { keys: ['圆珠', '珠链'], style: '圆珠' }
]

// 偏好标签关键词
export const preferenceTags: { keys: string[]; tag: string }[] = [
  { keys: ['高性价比', '便宜', '实惠', '划算'], tag: '高性价比' },
  { keys: ['收藏级', '高端', '顶级', '极品'], tag: '收藏级' },
  { keys: ['送礼佳品', '有面子', '拿得出手'], tag: '送礼佳品' },
  { keys: ['日常佩戴', '百搭', '通勤'], tag: '日常佩戴' }
]

// 用途关键词
export const usageMap: { keys: string[]; usage: string }[] = [
  { keys: ['佩戴', '日常'], usage: '日常佩戴' },
  { keys: ['送礼', '送人'], usage: '送礼' },
  { keys: ['收藏', '投资', '保值'], usage: '收藏投资' }
]

// ===== 多轮对话上下文关键词 =====
export const moreLikeThisKeys = ['再推荐几款', '还有吗', '继续', '换几个', '再来几个', '更多']
export const cheaperKeys = ['便宜点', '价格低一点', '预算少一点', '再便宜', '更便宜', '降点价']
export const premiumKeys = [
  '贵一点的',
  '品质好点',
  '更好一点',
  '高端一点',
  '品质高一点',
  '档次高一点'
]
export const changeCategoryKeys = ['别的品类', '换个品类', '其他品类', '换个类型', '别的类型']
