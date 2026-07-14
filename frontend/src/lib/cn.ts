import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merges Tailwind classes with conflict resolution — later classes override earlier ones
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
