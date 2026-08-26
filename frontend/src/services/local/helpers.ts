// SQLite returns INTEGER for booleans and TEXT for decimals/dates;
// these helpers convert raw rows into the shapes the web API produces.

export function money(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value
  return String(Math.round((n + Number.EPSILON) * 100) / 100)
}

export function toBool(value: unknown): boolean {
  return value === 1 || value === true
}

export function toNumber(value: unknown): number {
  return Number(value ?? 0)
}
