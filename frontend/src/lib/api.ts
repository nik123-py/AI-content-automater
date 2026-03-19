/**
 * API Client
 * ----------
 * Handles all HTTP requests to the backend API.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ============================================================================
// TYPES
// ============================================================================

export interface User {
  user_id: string
  name: string
  email: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Content {
  content_id: string
  user_id: string
  title: string | null
  original_text: string
  source_url: string | null
  language: string
  created_at: string
  job_count: number
}

export interface ContentList {
  items: Content[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface GeneratedOutput {
  output_id: string
  job_id: string
  output_text: string
  format_type: string
  is_edited: boolean
  created_at: string
  updated_at: string | null
}

export interface RepurposeJob {
  job_id: string
  content_id: string
  target_platform: string
  target_language: string
  status: string
  created_at: string
  completed_at: string | null
  outputs: GeneratedOutput[]
}

export interface RepurposeResult {
  content_id: string
  jobs: RepurposeJob[]
  total_generated: number
  failed_platforms: string[]
}

export interface TrendingTopic {
  topic: string
  reason: string
  content_idea?: string
  hashtags?: string[] | string
  best_time?: string
  engagement_tip?: string
  format?: string
  caption_idea?: string
  title_idea?: string
  outline?: string
  tags?: string[]
  platforms?: string[]
  blog_angle?: string
  keywords?: string[]
}

export interface TrendingResponse {
  platform: string
  trends: TrendingTopic[] | string
  generated_at: string
  raw?: boolean
}

export interface ViralContentResponse {
  topic: string
  platform: string
  style: string
  content: string
  generated_at: string
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Load token from localStorage on init (client-side only)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  // Set auth token
  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token)
      } else {
        localStorage.removeItem('auth_token')
      }
    }
  }

  // Get auth token
  getToken(): string | null {
    return this.token
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.token
  }

  // Generic fetch wrapper
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      // Extract error message from various formats
      let errorMessage = 'Request failed'
      if (typeof error.detail === 'string') {
        errorMessage = error.detail
      } else if (Array.isArray(error.detail)) {
        // Pydantic validation errors
        errorMessage = error.detail.map((e: { msg?: string }) => e.msg || 'Validation error').join(', ')
      } else if (error.message) {
        errorMessage = error.message
      }
      throw new Error(errorMessage)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  // ============================================================================
  // AUTH ENDPOINTS
  // ============================================================================

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.fetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    this.setToken(response.access_token)
    return response
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.fetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    this.setToken(response.access_token)
    return response
  }

  async getMe(): Promise<User> {
    return this.fetch<User>('/api/auth/me')
  }

  logout() {
    this.setToken(null)
  }

  // ============================================================================
  // CONTENT ENDPOINTS
  // ============================================================================

  async createContent(data: {
    title?: string
    original_text: string
    source_url?: string
    language?: string
  }): Promise<Content> {
    return this.fetch<Content>('/api/content', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async listContent(page = 1, pageSize = 10, search?: string): Promise<ContentList> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    })
    if (search) params.append('search', search)
    
    return this.fetch<ContentList>(`/api/content?${params}`)
  }

  async getContent(contentId: string): Promise<Content> {
    return this.fetch<Content>(`/api/content/${contentId}`)
  }

  async deleteContent(contentId: string): Promise<void> {
    await this.fetch<void>(`/api/content/${contentId}`, {
      method: 'DELETE',
    })
  }

  // ============================================================================
  // REPURPOSE ENDPOINTS
  // ============================================================================

  async repurposeContent(
    contentId: string,
    platforms: string[],
    targetLanguage = 'English'
  ): Promise<RepurposeResult> {
    return this.fetch<RepurposeResult>('/api/repurpose', {
      method: 'POST',
      body: JSON.stringify({
        content_id: contentId,
        platforms,
        target_language: targetLanguage,
      }),
    })
  }

  async getJobsForContent(contentId: string): Promise<RepurposeJob[]> {
    return this.fetch<RepurposeJob[]>(`/api/repurpose/content/${contentId}`)
  }

  async updateOutput(outputId: string, outputText: string): Promise<GeneratedOutput> {
    return this.fetch<GeneratedOutput>(`/api/repurpose/output/${outputId}`, {
      method: 'PUT',
      body: JSON.stringify({ output_text: outputText }),
    })
  }

  async checkOllamaHealth(): Promise<{ ollama_available: boolean; model: string }> {
    return this.fetch<{ ollama_available: boolean; model: string }>('/api/repurpose/health')
  }

  // ============================================================================
  // TRENDING ENDPOINTS
  // ============================================================================

  async getTrendingContent(platform = 'general'): Promise<TrendingResponse> {
    return this.fetch<TrendingResponse>(`/api/trending?platform=${platform}`)
  }

  async generateViralContent(
    topic: string,
    platform = 'linkedin',
    style = 'engaging'
  ): Promise<ViralContentResponse> {
    return this.fetch<ViralContentResponse>('/api/trending/generate', {
      method: 'POST',
      body: JSON.stringify({ topic, platform, style }),
    })
  }

  async checkGeminiHealth(): Promise<{ gemini_available: boolean; model: string; api_configured: boolean }> {
    return this.fetch<{ gemini_available: boolean; model: string; api_configured: boolean }>('/api/trending/health')
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL)
