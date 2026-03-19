'use client'

/**
 * Header Component
 * ----------------
 * Top header bar with user info and actions.
 */

import { User } from '@/lib/api'
import { Bell, Search } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface HeaderProps {
  user: User | null
  title?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function Header({ user, title }: HeaderProps) {
  return (
    <header className="h-16 border-b border-white/5 bg-surface-100/30 backdrop-blur-xl sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Title */}
        <div>
          {title && (
            <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Search className="w-5 h-5 text-text-muted" />
          </button>

          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-white/5 transition-colors relative">
            <Bell className="w-5 h-5 text-text-muted" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent-cyan rounded-full" />
          </button>

          {/* User */}
          {user && (
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-text-primary">{user.name}</p>
                <p className="text-xs text-text-muted">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
