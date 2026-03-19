/**
 * Utility Functions
 * -----------------
 * Common helper functions used across the application.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merge Tailwind classes with clsx
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to readable string
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return formatDate(date)
}

// Truncate text with ellipsis
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Platform display names and icons
export const PLATFORMS = {
  linkedin: { name: 'LinkedIn', color: '#0A66C2' },
  twitter: { name: 'Twitter/X', color: '#1DA1F2' },
  instagram: { name: 'Instagram', color: '#E4405F' },
  email: { name: 'Email Newsletter', color: '#EA4335' },
  youtube_script: { name: 'YouTube Script', color: '#FF0000' },
  youtube_shorts: { name: 'YouTube Shorts', color: '#FF0000' },
} as const

// Supported languages
export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Dutch',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
] as const
