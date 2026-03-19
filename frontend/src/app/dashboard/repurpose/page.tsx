'use client'

/**
 * Repurpose Page
 * --------------
 * Main content repurposing interface.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout'
import { Card, CardContent, Button, Textarea, Input, Select, Badge } from '@/components/ui'
import { useDashboard } from '../layout'
import { api, RepurposeResult, GeneratedOutput } from '@/lib/api'
import { PLATFORMS, LANGUAGES, copyToClipboard } from '@/lib/utils'
import {
  Sparkles,
  Loader2,
  Check,
  Copy,
  Download,
  RefreshCw,
  ChevronRight,
  AlertCircle,
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

export default function RepurposePage() {
  const router = useRouter()
  const { user } = useDashboard()
  
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [language, setLanguage] = useState('English')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  
  // Process state
  const [step, setStep] = useState<'input' | 'processing' | 'results'>('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<RepurposeResult | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Toggle platform selection
  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please enter some content to repurpose')
      return
    }
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform')
      return
    }

    setError('')
    setLoading(true)
    setStep('processing')

    try {
      // First create the content
      console.log('[REPURPOSE] Creating content...')
      const newContent = await api.createContent({
        title: title || undefined,
        original_text: content,
        language,
      })

      // Then repurpose it
      console.log('[REPURPOSE] Starting repurpose job...')
      const repurposeResult = await api.repurposeContent(
        newContent.content_id,
        selectedPlatforms,
        language
      )

      setResult(repurposeResult)
      setStep('results')
      console.log('[REPURPOSE] Completed successfully')
    } catch (err: unknown) {
      console.error('[REPURPOSE] Failed:', err)
      // Handle different error types
      let errorMessage = 'Failed to repurpose content'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null && 'detail' in err) {
        errorMessage = String((err as { detail: unknown }).detail)
      } else if (typeof err === 'string') {
        errorMessage = err
      }
      setError(errorMessage)
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  // Copy output to clipboard
  const handleCopy = async (output: GeneratedOutput) => {
    const success = await copyToClipboard(output.output_text)
    if (success) {
      setCopiedId(output.output_id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  // Reset form
  const handleReset = () => {
    setTitle('')
    setContent('')
    setSelectedPlatforms([])
    setResult(null)
    setStep('input')
  }

  return (
    <div className="min-h-screen">
      <Header user={user} title="New Repurpose" />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {['Input', 'Processing', 'Results'].map((label, index) => {
              const stepIndex = ['input', 'processing', 'results'].indexOf(step)
              const isActive = index === stepIndex
              const isCompleted = index < stepIndex

              return (
                <div key={label} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-accent-cyan text-white'
                          : isCompleted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-surface-100 text-text-muted'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <span className={`text-sm ${isActive ? 'text-text-primary' : 'text-text-muted'}`}>
                      {label}
                    </span>
                  </div>
                  {index < 2 && (
                    <ChevronRight className="w-4 h-4 text-text-muted mx-4" />
                  )}
                </div>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* Input Step */}
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{error}</span>
                  </div>
                )}

                {/* Content Input */}
                <Card>
                  <CardContent className="space-y-4">
                    <Input
                      label="Title (optional)"
                      placeholder="Give your content a title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />

                    <Textarea
                      label="Your Content"
                      placeholder="Paste your blog post, article, or any long-form content here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={10}
                    />

                    <Select
                      label="Output Language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      options={LANGUAGES.map(lang => ({ value: lang, label: lang }))}
                    />
                  </CardContent>
                </Card>

                {/* Platform Selection */}
                <Card>
                  <CardContent>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">
                      Select Output Platforms
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(PLATFORMS).map(([key, platform]) => {
                        const isSelected = selectedPlatforms.includes(key)
                        return (
                          <button
                            key={key}
                            onClick={() => togglePlatform(key)}
                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                              isSelected
                                ? 'bg-accent-cyan/10 border-accent-cyan/50 text-accent-cyan'
                                : 'bg-surface-100 border-white/10 text-text-secondary hover:border-white/20'
                            }`}
                          >
                            <div style={{ color: isSelected ? undefined : platform.color }}>
                              {platformIcons[key]}
                            </div>
                            <span className="font-medium">{platform.name}</span>
                            {isSelected && <Check className="w-4 h-4 ml-auto" />}
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!content.trim() || selectedPlatforms.length === 0}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Content
                </Button>
              </motion.div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center mb-6 animate-pulse">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  Generating Content...
                </h3>
                <p className="text-text-muted mb-6">
                  AI is transforming your content for {selectedPlatforms.length} platform(s)
                </p>
                <Loader2 className="w-6 h-6 text-accent-cyan animate-spin" />
              </motion.div>
            )}

            {/* Results Step */}
            {step === 'results' && result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Summary */}
                <Card className="bg-gradient-to-r from-emerald-500/10 to-accent-cyan/10 border-emerald-500/20">
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                          Generation Complete!
                        </h3>
                        <p className="text-text-muted">
                          Successfully generated {result.total_generated} out of {result.jobs.length} outputs
                        </p>
                      </div>
                      <Badge variant="success">
                        {result.total_generated}/{result.jobs.length} Success
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Generated Outputs */}
                <div className="space-y-4">
                  {result.jobs.map((job) => {
                    const platform = PLATFORMS[job.target_platform as keyof typeof PLATFORMS]
                    const output = job.outputs[0]

                    return (
                      <Card key={job.job_id}>
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
                                <p className="text-xs text-text-muted">{job.target_language}</p>
                              </div>
                            </div>
                            <Badge variant={job.status === 'completed' ? 'success' : 'error'}>
                              {job.status}
                            </Badge>
                          </div>

                          {output ? (
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
                              </div>
                            </>
                          ) : (
                            <p className="text-text-muted text-sm">
                              Failed to generate content for this platform
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                  <Button variant="secondary" onClick={handleReset}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Start New
                  </Button>
                  <Button onClick={() => router.push('/dashboard/content')}>
                    View All Content
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
