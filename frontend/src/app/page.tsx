'use client'

/**
 * Landing Page
 * ------------
 * Public landing page with hero section and features.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import {
  Zap,
  ArrowRight,
  Linkedin,
  Twitter,
  Instagram,
  Mail,
  Youtube,
  Sparkles,
  Globe,
  Clock,
  Shield,
} from 'lucide-react'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// ============================================================================
// FEATURES DATA
// ============================================================================

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'AI-Powered',
    description: 'Leverages local Ollama AI for intelligent content transformation',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Multi-Language',
    description: 'Generate content in 13+ languages instantly',
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Save Hours',
    description: 'Transform one piece into 6 formats in seconds',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Private & Secure',
    description: 'All processing happens locally on your machine',
  },
]

const platforms = [
  { icon: <Linkedin className="w-8 h-8" />, name: 'LinkedIn', color: '#0A66C2' },
  { icon: <Twitter className="w-8 h-8" />, name: 'Twitter/X', color: '#1DA1F2' },
  { icon: <Instagram className="w-8 h-8" />, name: 'Instagram', color: '#E4405F' },
  { icon: <Mail className="w-8 h-8" />, name: 'Email', color: '#EA4335' },
  { icon: <Youtube className="w-8 h-8" />, name: 'YouTube', color: '#FF0000' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export default function LandingPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(api.isAuthenticated())
  }, [])

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/auth/login')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-text-primary">Repurpose AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                  Sign In
                </Button>
                <Button onClick={() => router.push('/auth/register')}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-sm">
              <Sparkles className="w-4 h-4" />
              Powered by Local AI
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Transform Content
            <br />
            <span className="gradient-text">Into Everything</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-xl text-text-secondary max-w-2xl mx-auto mb-10"
          >
            Turn your blog posts and articles into social media content, 
            email newsletters, and video scripts with AI-powered repurposing.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={handleGetStarted}>
              Start Repurposing
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="secondary" size="lg">
              Watch Demo
            </Button>
          </motion.div>

          {/* Platform Icons */}
          <motion.div
            variants={itemVariants}
            className="mt-16 flex items-center justify-center gap-8"
          >
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="group relative"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${platform.color}20` }}
                >
                  <div style={{ color: platform.color }}>{platform.icon}</div>
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {platform.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Repurpose AI?
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Built for marketers and content creators who value efficiency and privacy.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card hover:border-accent-cyan/20"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-muted">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-3xl p-12 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/20 via-accent-purple/10 to-transparent" />
            <div className="absolute inset-0 bg-surface-50/80 backdrop-blur-xl" />
            
            {/* Content */}
            <div className="relative text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Save Hours Every Week?
              </h2>
              <p className="text-text-secondary max-w-xl mx-auto mb-8">
                Join content creators who are already transforming their workflow with AI-powered repurposing.
              </p>
              <Button size="lg" onClick={handleGetStarted}>
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-text-muted">Repurpose AI</span>
          </div>
          <p className="text-sm text-text-muted">
            Built with Ollama AI
          </p>
        </div>
      </footer>
    </div>
  )
}
