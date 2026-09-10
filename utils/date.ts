export function formatDate(d: Date | string | number): string {
  const date = d instanceof Date ? d : new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function today(): string {
  return formatDate(new Date())
}

export function formatDateTime(d: Date | string | number): string {
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleString('zh-CN')
}
