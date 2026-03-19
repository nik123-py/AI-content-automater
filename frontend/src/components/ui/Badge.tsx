'use client'

/**
 * Badge Component
 * ---------------
 * Status and label badges.
 */

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
}

// ============================================================================
// VARIANTS
// ============================================================================

const variants = {
  default: 'bg-white/10 text-text-secondary',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'
