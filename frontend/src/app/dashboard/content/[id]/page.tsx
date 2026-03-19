'use client'

/**
 * Content Detail Page
 * -------------------
 * View content details and generated outputs.
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout'
import { Card, CardContent, Button, Badge, Textarea } from '@/components/ui'
import { useDashboard } from '../../layout'
import { api, Content, RepurposeJob, GeneratedOutput } from '@/lib/api'
import { formatDate, copyToClipboard, PLATFORMS } from '@/lib/utils'
import {
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Edit2,
  Save,
  X,
  Sparkles,
  Linkedin,
  Twitter,
  Instagram,
  Mail,
  Youtube,
} from 'lucide-react'

// ============================================================================
// PLATFORM ICONS
// ============================================================================

const platformIcons: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-5 h-5" />,
  twitter: <Twitter className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  email: <Mail className="w-5 h-5" />,
  youtube_script: <Youtube className="w-5 h-5" />,
  youtube_shorts: <Youtube className="w-5 h-5" />,
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useDashboard()
  
  const [content, setContent] = useState<Content | null>(null)
  const [jobs, setJobs] = useState<RepurposeJob[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const contentId = params.id as string
        const [contentData, jobsData] = await Promise.all([
          api.getContent(contentId),
          api.getJobsForContent(contentId),
        ])
        setContent(contentData)
        setJobs(jobsData)
      } catch (error) {
        console.error('[CONTENT] Failed to fetch:', error)
        router.push('/dashboard/content')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, router])

  // Copy to clipboard
  const handleCopy = async (output: GeneratedOutput) => {
    const success = await copyToClipboard(output.output_text)
    if (success) {
      setCopiedId(output.output_id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  // Start editing
  const handleEdit = (output: GeneratedOutput) => {
    setEditingId(output.output_id)
    setEditText(output.output_text)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  // Save edit
  const handleSaveEdit = async (outputId: string) => {
    setSaving(true)
    try {
      await api.updateOutput(outputId, editText)
      
      // Update local state
      setJobs(prev => prev.map(job => ({
        ...job,
        outputs: job.outputs.map(output =>
          output.output_id === outputId
            ? { ...output, output_text: editText, is_edited: true }
            : output
        ),
      })))
      
      setEditingId(null)
      setEditText('')
    } catch (error) {
      console.error('[CONTENT] Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header user={user} title="Content Details" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
        </div>
      </div>
    )
  }

  if (!content) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Header user={user} title="Content Details" />

      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Link */}
          <Link
            href="/dashboard/content"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to content
          </Link>

          {/* Content Card */}
          <Card>
            <CardContent>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">
                    {content.title || 'Untitled Content'}
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge>{content.language}</Badge>
                    <span className="text-sm text-text-muted">
                      Created {formatDate(content.created_at)}
                    </span>
                  </div>
                </div>
                <Link href="/dashboard/repurpose">
                  <Button size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Repurpose Again
                  </Button>
                </Link>
              </div>

              <div className="bg-surface-100 rounded-xl p-4 max-h-60 overflow-y-auto">
                <p className="text-text-secondary whitespace-pre-wrap">
                  {content.original_text}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Generated Outputs */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Generated Outputs ({jobs.length})
            </h2>

            {jobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-muted mb-4">No outputs generated yet</p>
                  <Link href="/dashboard/repurpose">
                    <Button>Generate Outputs</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const platform = PLATFORMS[job.target_platform as keyof typeof PLATFORMS]
                  const output = job.outputs[0]

                  return (
                    <motion.div
                      key={job.job_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card>
                        <CardContent>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: `${platform?.color}20`, color: platform?.color }}
                              >
                                {platformIcons[job.target_platform]}
                              </div>
                              <div>
                                <h4 className="font-medium text-text-primary">
                                  {platform?.name || job.target_platform}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-text-muted">{job.target_language}</span>
                                  {output?.is_edited && (
                                    <Badge variant="warning">Edited</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge variant={job.status === 'completed' ? 'success' : 'error'}>
                              {job.status}
                            </Badge>
                          </div>

                          {output && (
                            <>
                              {editingId === output.output_id ? (
                                <div className="space-y-4">
                                  <Textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    rows={8}
                                  />
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveEdit(output.output_id)}
                                      loading={saving}
                                    >
                                      <Save className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="bg-surface-100 rounded-xl p-4 mb-4 max-h-60 overflow-y-auto">
                                    <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans">
                                      {output.output_text}
                                    </pre>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => handleCopy(output)}
                                    >
                                      {copiedId === output.output_id ? (
                                        <>
                                          <Check className="w-4 h-4 mr-1" />
                                          Copied!
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-4 h-4 mr-1" />
                                          Copy
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(output)}
                                    >
                                      <Edit2 className="w-4 h-4 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
