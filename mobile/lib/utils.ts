import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names with Tailwind CSS conflict resolution
 * @param inputs - Class names to combine
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Platform-specific styling helper
 */
export const platform = {
  ios: (styles: string) => `ios:${styles}`,
  android: (styles: string) => `android:${styles}`,
  web: (styles: string) => `web:${styles}`,
}

/**
 * Dark mode styling helper
 */
export const dark = (styles: string) => `dark:${styles}`

/**
 * Responsive breakpoint helpers
 */
export const breakpoints = {
  sm: (styles: string) => `sm:${styles}`,
  md: (styles: string) => `md:${styles}`,
  lg: (styles: string) => `lg:${styles}`,
  xl: (styles: string) => `xl:${styles}`,
  '2xl': (styles: string) => `2xl:${styles}`,
}