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

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function (this: any, ...args: Parameters<T>) {
    if (!timeout) {
      func.apply(this, args)
      timeout = setTimeout(() => {
        timeout = null
      }, delay)
    }
  } as T
}

export const hexWithAlpha = (hex: string, opacity: number): string => {
  // Если это не валидный hex, возвращаем как есть или дефолт
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return hex;

  // Убираем решетку
  let c = hex.substring(1);

  // Если hex короткий (#FFF), превращаем в полный (#FFFFFF)
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }

  // Переводим 0-1 в 00-FF
  const alpha = Math.round(opacity * 255);
  const alphaHex = alpha.toString(16).padStart(2, '0').toUpperCase();

  return `#${c}${alphaHex}`;
};
