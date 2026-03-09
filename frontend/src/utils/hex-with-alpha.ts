export function hexWithAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')

  if (clean.length !== 6) return hex // fallback

  // alpha = 0..1 → hex AA
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')

  return `#${clean}${a}`
}
