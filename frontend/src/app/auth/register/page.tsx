'use client'

/**
 * Register Page
 * -------------
 * New user registration page.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button, Input } from '@/components/ui'
import { api } from '@/lib/api'
import { Zap, User, Mail, Lock, ArrowLeft } from 'lucide-react'

// ============================================================================
// COMPONENT
// ============================================================================

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      await api.register(name, email, password)
      console.log('[AUTH] Registration successful')
      router.push('/dashboard')
    } catch (err) {
      console.error('[AUTH] Registration failed:', err)
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-surface-100/50 border-r border-white/5">
        <div className="max-w-md text-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center mx-auto mb-8 shadow-glow">
              <Zap className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              Join Repurpose AI
            </h2>
            <p className="text-text-secondary">
              Create your account and start transforming your content into multiple formats instantly.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Create account</h1>
              <p className="text-text-muted">Get started for free</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="w-5 h-5" />}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              required
            />

            <Button type="submit" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-text-muted">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-accent-cyan hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
