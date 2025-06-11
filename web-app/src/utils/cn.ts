/**
 * cn.ts
 * 
 * Utility for combining Tailwind classes
 * 
 * Functions:
 *   cn - Combines class names with clsx and tailwind-merge
 * 
 * Usage: import { cn } from './utils/cn'
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and deduplicates Tailwind classes using tailwind-merge
 * 
 * @param inputs - Class values to combine (strings, objects, arrays, etc.)
 * @returns Combined and deduplicated class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 