'use client'

/**
 * Content List Page
 * -----------------
 * View and manage all saved content.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout'
import { Card, CardContent, Button, Input, Badge } from '@/components/ui'
import { useDashboard } from '../layout'
import { api, Content, ContentList } from '@/lib/api'
import { formatRelativeTime, truncate } from '@/lib/utils'
import {
  Search,
  Plus,
  FileText,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// ============================================================================
// COMPONENT
// ============================================================================

export default function ContentListPage() {
  const { user } = useDashboard()
  const [contentList, setContentList] = useState<ContentList | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Fetch content
  const fetchContent = async () => {
    setLoading(true)
    try {
      const data = await api.listContent(page, 10, search || undefined)
      setContentList(data)
    } catch (error) {
      console.error('[CONTENT] Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContent()
  }, [page])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchContent()
  }

  // Handle delete
  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    setDeleting(contentId)
    try {
      await api.deleteContent(contentId)
      fetchContent()
    } catch (error) {
      console.error('[CONTENT] Failed to delete:', error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen">
      <Header user={user} title="My Content" />

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <Input
                placeholder="Search content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-5 h-5" />}
              />
            </form>
            <Link href="/dashboard/repurpose">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Content
              </Button>
            </Link>
          </div>

          {/* Content List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
            </div>
          ) : contentList?.items.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <FileText className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  No content yet
                </h3>
                <p className="text-text-muted mb-6">
                  Start by creating your first piece of content to repurpose.
                </p>
                <Link href="/dashboard/repurpose">
                  <Button>Create Content</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {contentList?.items.map((content, index) => (
                <motion.div
                  key={content.content_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card hover className="group">
                    <CardContent>
                      <div className="flex items-start justify-between gap-4">
                        <Link
                          href={`/dashboard/content/${content.content_id}`}
                          className="flex-1 min-w-0"
                        >
                          <h3 className="font-semibold text-text-primary group-hover:text-accent-cyan transition-colors">
                            {content.title || 'Untitled Content'}
                          </h3>
                          <p className="text-sm text-text-muted mt-1 line-clamp-2">
                            {truncate(content.original_text, 150)}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge variant="info">{content.job_count} jobs</Badge>
                            <Badge>{content.language}</Badge>
                            <span className="text-xs text-text-muted">
                              {formatRelativeTime(content.created_at)}
                            </span>
                          </div>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(content.content_id)}
                          disabled={deleting === content.content_id}
                          className="text-text-muted hover:text-red-400"
                        >
                          {deleting === content.content_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {contentList && contentList.total > 10 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-text-muted">
                Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, contentList.total)} of {contentList.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-text-muted px-2">
                  Page {page}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!contentList.has_more}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
