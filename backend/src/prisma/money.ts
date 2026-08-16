export function money(value: number | string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  return String(Math.round((n + Number.EPSILON) * 100) / 100);
}

export function toMoney(value: number | undefined): string | undefined {
  return value === undefined ? undefined : money(value);
}
