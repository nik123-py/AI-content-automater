'use client'

/**
 * Select Component
 * ----------------
 * Styled dropdown select.
 */

import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full px-4 py-3 pr-10 rounded-xl transition-all duration-300 appearance-none',
              'bg-surface-100 border border-white/10',
              'text-text-primary',
              'focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/20 focus:outline-none',
              error && 'border-red-500/50',
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
