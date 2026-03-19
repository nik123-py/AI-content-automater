'use client'

/**
 * Dashboard Layout
 * ----------------
 * Shared layout for all dashboard pages with sidebar.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/layout'
import { api, User } from '@/lib/api'
import { Loader2 } from 'lucide-react'

// ============================================================================
// CONTEXT
// ============================================================================

import { createContext, useContext } from 'react'

interface DashboardContextType {
  user: User | null
  refreshUser: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType>({
  user: null,
  refreshUser: async () => {},
})

export const useDashboard = () => useContext(DashboardContext)

// ============================================================================
// COMPONENT
// ============================================================================

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!api.isAuthenticated()) {
        router.push('/auth/login')
        return
      }

      try {
        const userData = await api.getMe()
        setUser(userData)
      } catch (error) {
        console.error('[DASHBOARD] Failed to fetch user:', error)
        api.logout()
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  // Refresh user data
  const refreshUser = async () => {
    try {
      const userData = await api.getMe()
      setUser(userData)
    } catch (error) {
      console.error('[DASHBOARD] Failed to refresh user:', error)
    }
  }

  // Handle logout
  const handleLogout = () => {
    api.logout()
    router.push('/auth/login')
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
          <p className="text-text-muted">Loading...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <DashboardContext.Provider value={{ user, refreshUser }}>
      <div className="min-h-screen">
        {/* Sidebar */}
        <Sidebar onLogout={handleLogout} />

        {/* Main Content */}
        <main className="ml-[280px] min-h-screen transition-all duration-300">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </DashboardContext.Provider>
  )
}
