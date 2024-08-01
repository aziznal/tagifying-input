import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(num, max));
}

