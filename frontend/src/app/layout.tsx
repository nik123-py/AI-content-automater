import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// ============================================================================
// FONTS
// ============================================================================

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Repurpose AI | Transform Content Instantly',
  description: 'Transform long-form content into social media posts, emails, and video scripts using AI',
  keywords: ['AI', 'content repurposing', 'social media', 'marketing', 'automation'],
}

// ============================================================================
// ROOT LAYOUT
// ============================================================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
