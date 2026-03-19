'use client'

/**
 * Button Component
 * ----------------
 * Reusable button with multiple variants and states.
 */

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

// ============================================================================
// VARIANTS
// ============================================================================

const variants = {
  primary: 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white hover:shadow-glow',
  secondary: 'bg-surface-50 border border-white/10 text-text-primary hover:bg-surface-100 hover:border-accent-cyan/30',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5',
  danger: 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          <span className="w-4 h-4">{icon}</span>
        ) : null}
        {children}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
