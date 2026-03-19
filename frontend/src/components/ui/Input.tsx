'use client'

/**
 * Input Component
 * ---------------
 * Styled input field with label and error states.
 */

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full px-4 py-3 rounded-xl transition-all duration-300',
              'bg-surface-100 border border-white/10',
              'text-text-primary placeholder:text-text-muted',
              'focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/20 focus:outline-none',
              icon && 'pl-12',
              error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
