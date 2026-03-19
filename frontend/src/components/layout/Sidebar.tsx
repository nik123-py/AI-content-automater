'use client'

/**
 * Sidebar Component
 * -----------------
 * Main navigation sidebar for the dashboard.
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Settings,
  LogOut,
  ChevronLeft,
  Zap,
  TrendingUp,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface SidebarProps {
  onLogout: () => void
}

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Trending', href: '/dashboard/trending', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'My Content', href: '/dashboard/content', icon: <FileText className="w-5 h-5" /> },
  { label: 'New Repurpose', href: '/dashboard/repurpose', icon: <Sparkles className="w-5 h-5" /> },
  { label: 'Settings', href: '/dashboard/settings', icon: <Settings className="w-5 h-5" /> },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function Sidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-surface-100/50 backdrop-blur-xl border-r border-white/5 z-40"
    >
      <div className="flex flex-col h-full p-4">
        {/* Logo */}
        <div className="flex items-center justify-between mb-8 px-2">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-lg text-text-primary">Repurpose</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft className="w-5 h-5 text-text-muted" />
            </motion.div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                    'text-text-secondary hover:text-text-primary',
                    isActive && 'bg-accent-cyan/10 text-accent-cyan border-l-2 border-accent-cyan',
                    !isActive && 'hover:bg-white/5'
                  )}
                >
                  {item.icon}
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={onLogout}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
            'text-text-secondary hover:text-red-400 hover:bg-red-500/10'
          )}
        >
          <LogOut className="w-5 h-5" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-medium whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
