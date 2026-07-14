export const getRandomColor = (): string => {
  return (
    '#' +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
  )
}

export const isValidHex = (color: string) => {
  return /^#[0-9A-F]{6}$/i.test(color)
}

// Leading-edge throttle: invokes immediately on first call, then ignores subsequent calls within the delay window
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let timeout: ReturnType<typeof setTimeout> | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (this: any, ...args: Parameters<T>) {
    if (!timeout) {
      func.apply(this, args)
      timeout = setTimeout(() => {
        timeout = null
      }, delay)
    }
  } as T
}

// Appends an alpha channel to a hex color (e.g., #FF0000 + 0.5 → #FF000080)
export const hexWithAlpha = (hex: string, opacity: number): string => {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return hex;

  let c = hex.substring(1);

  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }

  const alpha = Math.round(opacity * 255);
  const alphaHex = alpha.toString(16).padStart(2, '0').toUpperCase();

  return `#${c}${alphaHex}`;
};
