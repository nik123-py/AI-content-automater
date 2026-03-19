'use client'

/**
 * Textarea Component
 * ------------------
 * Styled textarea with auto-resize capability.
 */

import { forwardRef, TextareaHTMLAttributes, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  autoResize?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, autoResize = false, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    // Auto-resize logic
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [props.value, autoResize])

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <textarea
          ref={(node) => {
            textareaRef.current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          className={cn(
            'w-full px-4 py-3 rounded-xl transition-all duration-300 resize-none',
            'bg-surface-100 border border-white/10',
            'text-text-primary placeholder:text-text-muted',
            'focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/20 focus:outline-none',
            error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
