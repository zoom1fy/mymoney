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
export function createThrottle<TFunc extends (...args: any[]) => void>(
  func: TFunc,
  delay: number
): TFunc {
  let timeout: ReturnType<typeof setTimeout> | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (this: any, ...args: Parameters<TFunc>) {
    if (!timeout) {
      func.apply(this, args)
      timeout = setTimeout(() => {
        timeout = null
      }, delay)
    }
  } as TFunc
}

// Appends an alpha channel to a hex color (e.g., #FF0000 + 0.5 → #FF000080)
export const applyAlphaToHex = (hex: string, opacity: number): string => {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return hex;

  let hexValue = hex.substring(1);

  if (hexValue.length === 3) {
    hexValue = hexValue.split('').map(char => char + char).join('');
  }

  const alpha = Math.round(opacity * 255);
  const alphaHex = alpha.toString(16).padStart(2, '0').toUpperCase();

  return `#${hexValue}${alphaHex}`;
};
