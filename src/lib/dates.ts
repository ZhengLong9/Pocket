export const TIME_ZONE = 'Asia/Singapore'

export function todayISO(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (name: string) => parts.find((item) => item.type === name)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function daysInMonth(month: string): number {
  const [year, number] = month.split('-').map(Number)
  return new Date(Date.UTC(year, number, 0)).getUTCDate()
}

export function dateInMonth(month: string, day: number): string {
  return `${month}-${String(Math.min(day, daysInMonth(month))).padStart(2, '0')}`
}

export function shiftMonth(month: string, offset: number): string {
  const [year, number] = month.split('-').map(Number)
  return new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7)
}

export function monthLabel(month: string, short = false): string {
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: 'UTC',
    month: short ? 'short' : 'long',
    year: 'numeric',
  }).format(new Date(`${month}-01T12:00:00Z`))
}

export function dateLabel(date: string): string {
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${date}T12:00:00Z`))
}

export function contributionCount(today: string, deadline: string): number {
  if (deadline < today) return 0
  const [year, month] = today.split('-').map(Number)
  const [endYear, endMonth] = deadline.split('-').map(Number)
  return Math.max(1, (endYear - year) * 12 + endMonth - month)
}
