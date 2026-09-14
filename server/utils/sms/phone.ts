/**
 * 清洗家长手机号：去空白/分隔符，剥 +86 / 0086 / 86 前缀。
 * 合规返回 11 位中国大陆手机号，否则返回 null。
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let p = String(raw).replace(/[\s\-()]/g, '')
  if (/^(\+?0{0,2})?861\d{10}$/.test(p)) {
    p = p.replace(/^(\+?0{0,2})?86/, '')
  }
  return /^1\d{10}$/.test(p) ? p : null
}
