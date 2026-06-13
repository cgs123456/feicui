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
 * Sanitize user input for display
 */
export function sanitizeInput(input: string): string {
  return escapeHtml(input.trim())
}
