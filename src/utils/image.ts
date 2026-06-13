/**
 * 图片 CDN 裁剪工具
 * 根据当前环境自动追加 CDN 裁剪参数，优化加载速度
 */

/** 支持裁剪的 CDN 域名列表 */
const CDN_DOMAINS = ['trae-api-cn.mchost.guru', 'images.unsplash.com']

/**
 * 为图片 URL 追加 CDN 裁剪参数
 * @param url - 原始图片 URL
 * @param width - 目标宽度（默认 400）
 * @returns 带裁剪参数的 URL
 */
export function resizeImage(url: string, width: number = 400): string {
  if (!url) return ''

  // 仅对 CDN 域名的图片做裁剪
  const isCdn = CDN_DOMAINS.some(domain => url.includes(domain))
  if (isCdn) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}imageView2/2/w/${width}`
  }

  return url
}

/**
 * 生成缩略图 URL（列表页使用）
 */
export function thumbnail(url: string): string {
  return resizeImage(url, 200)
}

/**
 * 生成详情大图 URL
 */
export function detailImage(url: string): string {
  return resizeImage(url, 800)
}
