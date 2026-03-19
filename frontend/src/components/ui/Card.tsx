'use client'

/**
 * Card Component
 * --------------
 * Glass-morphism card container.
 */

import { HTMLAttributes, forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, glow = false, children, ...props }, ref) => {
    const Component = hover ? motion.div : 'div'
    
    const motionProps = hover ? {
      whileHover: { scale: 1.01, y: -2 },
      transition: { duration: 0.2 }
    } : {}

    return (
      <Component
        ref={ref}
        className={cn(
          'rounded-2xl p-6 transition-all duration-300',
          'bg-surface-50/80 backdrop-blur-xl',
          'border border-white/5',
          hover && 'cursor-pointer hover:border-white/10',
          glow && 'hover:shadow-glow',
          className
        )}
        {...motionProps}
        {...(props as HTMLMotionProps<'div'>)}
      >
        {children}
      </Component>
    )
  }
)

Card.displayName = 'Card'

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-text-primary', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-text-muted mt-1', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('', className)}
      {...props}
    />
  )
)
CardContent.displayName = 'CardContent'
