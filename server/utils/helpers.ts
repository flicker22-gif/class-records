import { customAlphabet } from 'nanoid'

export const generateShareToken = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyz',
  16,
)

export const PACKAGE_OPTIONS = [20, 40, 60]
export const LOW_REMAINING_THRESHOLD = 5

export function formatDate(d: Date | string | number): string {
  const date = d instanceof Date ? d : new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function today(): string {
  return formatDate(new Date())
}
