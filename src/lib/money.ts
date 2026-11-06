const formatter = new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' })
const shortFormatter = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
  maximumFractionDigits: 0,
})

function singaporeSymbol(parts: Intl.NumberFormatPart[]): string {
  return parts.map((part) => (part.type === 'currency' ? 'S$' : part.value)).join('')
}
export const formatMoney = (cents: number) => singaporeSymbol(formatter.formatToParts(cents / 100))
export const shortMoney = (cents: number) =>
  singaporeSymbol(shortFormatter.formatToParts(cents / 100))
export const moneyInput = (cents: number) => (cents / 100).toFixed(2)

/** Parse currency text without doing floating-point arithmetic on money. */
export function parseMoney(value: string): number | null {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(value.trim())) return null
  const [dollars, fraction = ''] = value.trim().split('.')
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents <= 100_000_000 ? cents : null
}
