import DOMPurify from 'dompurify'

/**
 * Escape HTML special characters to prevent XSS (for plain text display)
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
 * Uses DOMPurify for production-grade XSS protection.
 *
 * @param html - Raw HTML string to sanitize
 * @param allowedTags - Tags to preserve (default: basic formatting only)
 * @returns Sanitized HTML string safe for v-html
 */
export function sanitizeHtml(
  html: string,
  allowedTags: string[] = ['p', 'br', 'strong', 'em', 'b', 'i', 'span']
): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ['class', 'style']
  })
}
