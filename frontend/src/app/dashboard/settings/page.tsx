'use client'

/**
 * Settings Page
 * -------------
 * User settings and preferences.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout'
import { Card, CardContent, Button, Badge } from '@/components/ui'
import { useDashboard } from '../layout'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import {
  User,
  Shield,
  Cpu,
  Check,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react'

// ============================================================================
// COMPONENT
// ============================================================================

export default function SettingsPage() {
  const { user } = useDashboard()
  const [ollamaStatus, setOllamaStatus] = useState<{
    available: boolean
    model: string
    checking: boolean
  }>({
    available: false,
    model: '',
    checking: true,
  })

  // Check Ollama status
  const checkOllama = async () => {
    setOllamaStatus(prev => ({ ...prev, checking: true }))
    try {
      const health = await api.checkOllamaHealth()
      setOllamaStatus({
        available: health.ollama_available,
        model: health.model,
        checking: false,
      })
    } catch (error) {
      setOllamaStatus({
        available: false,
        model: '',
        checking: false,
      })
    }
  }

  useEffect(() => {
    checkOllama()
  }, [])

  return (
    <div className="min-h-screen">
      <Header user={user} title="Settings" />

      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {/* Profile Section */}
          <Card>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-accent-cyan" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Profile</h2>
                  <p className="text-sm text-text-muted">Your account information</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-text-muted">Name</span>
                  <span className="text-text-primary font-medium">{user?.name}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-text-muted">Email</span>
                  <span className="text-text-primary font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-text-muted">Member since</span>
                  <span className="text-text-primary font-medium">
                    {user?.created_at ? formatDate(user.created_at) : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Status Section */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-accent-purple" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">AI Engine</h2>
                    <p className="text-sm text-text-muted">Ollama connection status</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkOllama}
                  disabled={ollamaStatus.checking}
                >
                  {ollamaStatus.checking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-text-muted">Status</span>
                  {ollamaStatus.checking ? (
                    <Badge>Checking...</Badge>
                  ) : ollamaStatus.available ? (
                    <Badge variant="success">
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="error">
                      <X className="w-3 h-3 mr-1" />
                      Disconnected
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-text-muted">Model</span>
                  <span className="text-text-primary font-medium">
                    {ollamaStatus.model || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-text-muted">Endpoint</span>
                  <code className="text-sm text-accent-cyan bg-accent-cyan/10 px-2 py-1 rounded">
                    localhost:11434
                  </code>
                </div>
              </div>

              {!ollamaStatus.available && !ollamaStatus.checking && (
                <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-400">
                    Ollama is not running. Make sure to start Ollama with:
                  </p>
                  <code className="block mt-2 text-sm text-text-primary bg-surface-100 p-2 rounded">
                    ollama serve
                  </code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Security</h2>
                  <p className="text-sm text-text-muted">Privacy and data protection</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-text-muted">Data Processing</span>
                  <Badge variant="success">Local Only</Badge>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-text-muted">AI Provider</span>
                  <span className="text-text-primary font-medium">Ollama (Self-hosted)</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-text-muted">External API Calls</span>
                  <Badge variant="success">None</Badge>
                </div>
              </div>

              <p className="mt-4 text-sm text-text-muted">
                All content processing happens locally on your machine. 
                Your data never leaves your computer.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
