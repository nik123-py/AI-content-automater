'use client'

/**
 * Trending Content Page
 * ---------------------
 * Discover trending topics and generate viral content using Gemini AI.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/layout'
import { Card, CardContent, Button, Select, Input, Textarea, Badge } from '@/components/ui'
import { useDashboard } from '../layout'
import { api, TrendingTopic, TrendingResponse, ViralContentResponse } from '@/lib/api'
import {
  TrendingUp,
  Sparkles,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Zap,
  Target,
  Hash,
  Clock,
  Lightbulb,
  AlertCircle,
} from 'lucide-react'
import { copyToClipboard } from '@/lib/utils'

// ============================================================================
// PLATFORM CONFIG
// ============================================================================

const PLATFORMS = [
  { value: 'general', label: 'All Platforms', icon: Globe, color: '#6366F1' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { value: 'twitter', label: 'Twitter/X', icon: Twitter, color: '#1DA1F2' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: '#E4405F' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0000' },
]

const STYLES = [
  { value: 'engaging', label: 'Engaging' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'humorous', label: 'Humorous' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export default function TrendingPage() {
  const { user } = useDashboard()
  
  // Trending state
  const [platform, setPlatform] = useState('general')
  const [trends, setTrends] = useState<TrendingResponse | null>(null)
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [trendError, setTrendError] = useState('')
  
  // Viral content state
  const [selectedTopic, setSelectedTopic] = useState('')
  const [viralPlatform, setViralPlatform] = useState('linkedin')
  const [viralStyle, setViralStyle] = useState('engaging')
  const [viralContent, setViralContent] = useState<ViralContentResponse | null>(null)
  const [loadingViral, setLoadingViral] = useState(false)
  const [viralError, setViralError] = useState('')
  const [copied, setCopied] = useState(false)

  // Fetch trending content
  const fetchTrends = async () => {
    setLoadingTrends(true)
    setTrendError('')
    setTrends(null)
    
    try {
      const data = await api.getTrendingContent(platform)
      setTrends(data)
      console.log('[TRENDING] Fetched trends:', data)
    } catch (error) {
      console.error('[TRENDING] Failed to fetch:', error)
      setTrendError(error instanceof Error ? error.message : 'Failed to fetch trending content')
    } finally {
      setLoadingTrends(false)
    }
  }

  // Generate viral content
  const generateViral = async () => {
    if (!selectedTopic.trim()) {
      setViralError('Please enter a topic')
      return
    }
    
    setLoadingViral(true)
    setViralError('')
    setViralContent(null)
    
    try {
      const data = await api.generateViralContent(selectedTopic, viralPlatform, viralStyle)
      setViralContent(data)
      console.log('[TRENDING] Generated viral content:', data)
    } catch (error) {
      console.error('[TRENDING] Failed to generate:', error)
      setViralError(error instanceof Error ? error.message : 'Failed to generate content')
    } finally {
      setLoadingViral(false)
    }
  }

  // Copy content
  const handleCopy = async () => {
    if (viralContent) {
      const success = await copyToClipboard(viralContent.content)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  // Use trend as topic
  const useTrendAsTopic = (topic: string) => {
    setSelectedTopic(topic)
    // Scroll to generator
    document.getElementById('viral-generator')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Get platform icon
  const getPlatformIcon = (platformKey: string) => {
    const p = PLATFORMS.find(p => p.value === platformKey)
    if (p) {
      const Icon = p.icon
      return <Icon className="w-5 h-5" style={{ color: p.color }} />
    }
    return <Globe className="w-5 h-5" />
  }

  return (
    <div className="min-h-screen">
      <Header user={user} title="Trending Content" />

      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Discover Viral Content Ideas
            </h1>
            <p className="text-text-muted max-w-xl mx-auto">
              Use AI to find trending topics and generate content that goes viral on any platform.
            </p>
          </motion.div>

          {/* Trending Topics Section */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent-purple" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Trending Now</h2>
                    <p className="text-sm text-text-muted">Real-time trending topics powered by Gemini AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    options={PLATFORMS.map(p => ({ value: p.value, label: p.label }))}
                    className="w-40"
                  />
                  <Button onClick={fetchTrends} disabled={loadingTrends}>
                    {loadingTrends ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Fetch Trends
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Error */}
              {trendError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{trendError}</span>
                </div>
              )}

              {/* Loading */}
              {loadingTrends && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-accent-cyan animate-spin mb-4" />
                  <p className="text-text-muted">Analyzing trending content...</p>
                </div>
              )}

              {/* Trends Grid */}
              {trends && !loadingTrends && (
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {Array.isArray(trends.trends) ? (
                      trends.trends.map((trend: TrendingTopic, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card hover className="h-full">
                            <CardContent className="space-y-3">
                              <div className="flex items-start justify-between">
                                <Badge variant="info" className="text-xs">
                                  #{index + 1} Trending
                                </Badge>
                                {getPlatformIcon(platform)}
                              </div>
                              
                              <h3 className="font-semibold text-text-primary line-clamp-2">
                                {trend.topic}
                              </h3>
                              
                              <p className="text-sm text-text-muted line-clamp-3">
                                {trend.reason}
                              </p>
                              
                              {trend.content_idea && (
                                <div className="flex items-start gap-2 text-sm">
                                  <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-text-secondary line-clamp-2">{trend.content_idea}</span>
                                </div>
                              )}
                              
                              {trend.hashtags && (
                                <div className="flex items-start gap-2 text-sm">
                                  <Hash className="w-4 h-4 text-accent-cyan mt-0.5 flex-shrink-0" />
                                  <span className="text-text-muted line-clamp-1">
                                    {Array.isArray(trend.hashtags) ? trend.hashtags.join(' ') : trend.hashtags}
                                  </span>
                                </div>
                              )}
                              
                              {trend.best_time && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-accent-purple" />
                                  <span className="text-text-muted">{trend.best_time}</span>
                                </div>
                              )}
                              
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-full mt-2"
                                onClick={() => useTrendAsTopic(trend.topic)}
                              >
                                <Zap className="w-4 h-4 mr-2" />
                                Use This Topic
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full">
                        <Card>
                          <CardContent>
                            <pre className="text-sm text-text-secondary whitespace-pre-wrap">
                              {typeof trends.trends === 'string' ? trends.trends : JSON.stringify(trends.trends, null, 2)}
                            </pre>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Empty State */}
              {!trends && !loadingTrends && !trendError && (
                <div className="text-center py-16">
                  <TrendingUp className="w-16 h-16 text-text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    No trends loaded yet
                  </h3>
                  <p className="text-text-muted mb-6">
                    Click "Fetch Trends" to discover what's trending right now.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Viral Content Generator */}
          <Card id="viral-generator">
            <CardContent>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Viral Content Generator</h2>
                  <p className="text-sm text-text-muted">Generate optimized content for maximum engagement</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                  <Input
                    label="Topic"
                    placeholder="Enter a topic or paste from trends above..."
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    icon={<Target className="w-5 h-5" />}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Platform"
                      value={viralPlatform}
                      onChange={(e) => setViralPlatform(e.target.value)}
                      options={PLATFORMS.filter(p => p.value !== 'general').map(p => ({ 
                        value: p.value, 
                        label: p.label 
                      }))}
                    />
                    <Select
                      label="Style"
                      value={viralStyle}
                      onChange={(e) => setViralStyle(e.target.value)}
                      options={STYLES}
                    />
                  </div>

                  {viralError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {viralError}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={generateViral}
                    disabled={loadingViral || !selectedTopic.trim()}
                  >
                    {loadingViral ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Viral Content
                      </>
                    )}
                  </Button>
                </div>

                {/* Output Section */}
                <div>
                  {viralContent ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(viralContent.platform)}
                          <Badge variant="success">Generated</Badge>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleCopy}
                        >
                          {copied ? (
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
                      <div className="bg-surface-100 rounded-xl p-4 max-h-80 overflow-y-auto">
                        <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans">
                          {viralContent.content}
                        </pre>
                      </div>
                      <p className="text-xs text-text-muted">
                        Generated at {new Date(viralContent.generated_at).toLocaleString()}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-surface-100/50 rounded-xl border border-white/5 min-h-[200px]">
                      <div className="text-center">
                        <Sparkles className="w-12 h-12 text-text-muted mx-auto mb-3" />
                        <p className="text-text-muted">
                          Generated content will appear here
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
