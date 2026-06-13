/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return str.replace(/[&<>"']/g, m => map[m] || m)
}

/**
 * Sanitize user input for display (plain text)
 */
export function sanitizeInput(input: string): string {
  return escapeHtml(input.trim())
}

/**
 * Sanitize HTML content for safe rendering with v-html.
 * Uses a whitelist approach: strips all tags except explicitly allowed ones.
 * For production, consider using DOMPurify library instead.
 *
 * @param html - Raw HTML string to sanitize
 * @param allowedTags - Tags to preserve (default: basic formatting only)
 * @returns Sanitized HTML string safe for v-html
 */
export function sanitizeHtml(
  html: string,
  allowedTags: string[] = ['b', 'i', 'em', 'strong', 'br', 'p', 'span']
): string {
  if (!html) return ''

  // 先转义所有 HTML
  let sanitized = escapeHtml(html)

  // 还原允许的标签
  const tagPattern = new RegExp(
    `&lt;(/?)(${allowedTags.join('|')})(\\s[^&]*)?&gt;`,
    'gi'
  )
  sanitized = sanitized.replace(tagPattern, (_match, closing, tag, attrs) => {
    const attrStr = attrs ? attrs.replace(/&quot;/g, '"').replace(/&#039;/g, "'") : ''
    return `<${closing}${tag}${attrStr}>`
  })

  // 移除所有 on* 事件属性
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')

  // 移除 javascript: 协议
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')

  return sanitized
}
