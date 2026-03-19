'use client'

/**
 * Dashboard Home Page
 * -------------------
 * Overview with stats and recent activity.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout'
import { Card, CardContent, Button, Badge } from '@/components/ui'
import { useDashboard } from './layout'
import { api, Content, ContentList } from '@/lib/api'
import { formatRelativeTime, truncate, PLATFORMS } from '@/lib/utils'
import {
  FileText,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Plus,
  Loader2,
} from 'lucide-react'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DashboardPage() {
  const { user } = useDashboard()
  const [recentContent, setRecentContent] = useState<Content[]>([])
  const [stats, setStats] = useState({ totalContent: 0, totalJobs: 0 })
  const [loading, setLoading] = useState(true)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const contentList = await api.listContent(1, 5)
        setRecentContent(contentList.items)
        
        // Calculate stats
        const totalJobs = contentList.items.reduce((sum, c) => sum + c.job_count, 0)
        setStats({
          totalContent: contentList.total,
          totalJobs,
        })
      } catch (error) {
        console.error('[DASHBOARD] Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen">
      <Header user={user} title="Dashboard" />

      <div className="p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-6xl mx-auto space-y-8"
        >
          {/* Welcome Section */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h2>
            <p className="text-text-muted">
              Here&apos;s what&apos;s happening with your content.
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-accent-cyan" />
                  </div>
                  <div>
                    <p className="text-text-muted text-sm">Total Content</p>
                    <p className="text-3xl font-bold text-text-primary">{stats.totalContent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-purple/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-accent-purple" />
                  </div>
                  <div>
                    <p className="text-text-muted text-sm">Repurpose Jobs</p>
                    <p className="text-3xl font-bold text-text-primary">{stats.totalJobs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent-pink/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-pink/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-accent-pink" />
                  </div>
                  <div>
                    <p className="text-text-muted text-sm">Platforms</p>
                    <p className="text-3xl font-bold text-text-primary">{Object.keys(PLATFORMS).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-accent-cyan/10 via-accent-purple/10 to-accent-pink/10 border-accent-cyan/20">
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      Ready to repurpose?
                    </h3>
                    <p className="text-text-muted">
                      Transform your content into multiple formats instantly.
                    </p>
                  </div>
                  <Link href="/dashboard/repurpose">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Repurpose
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Content */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Recent Content</h3>
              <Link href="/dashboard/content">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
              </div>
            ) : recentContent.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted mb-4">No content yet</p>
                  <Link href="/dashboard/repurpose">
                    <Button>Create Your First Content</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentContent.map((content, index) => (
                  <motion.div
                    key={content.content_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/dashboard/content/${content.content_id}`}>
                      <Card hover className="group">
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-text-primary group-hover:text-accent-cyan transition-colors truncate">
                                {content.title || 'Untitled Content'}
                              </h4>
                              <p className="text-sm text-text-muted truncate mt-1">
                                {truncate(content.original_text, 100)}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 ml-4">
                              <Badge variant="info">{content.job_count} jobs</Badge>
                              <span className="text-xs text-text-muted whitespace-nowrap">
                                {formatRelativeTime(content.created_at)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
