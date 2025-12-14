const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9501'

interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  details?: Array<{ message: string }>
}

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    if (this.token) return this.token
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_URL}${endpoint}`
    const token = this.getToken()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Merge additional headers from options
    if (options.headers) {
      const optHeaders = options.headers as Record<string, string>
      Object.assign(headers, optHeaders)
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: data.error || 'An error occurred',
          details: data.details,
        }
      }

      return { data }
    } catch (error) {
      console.error('API request failed:', error)
      return { error: 'Network error. Please try again.' }
    }
  }

  // Auth endpoints
  async register(data: {
    email: string
    password: string
    fullName: string
    phone: string
    organization?: string
  }) {
    return this.request<{ message: string; userId: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{
      message: string
      token: string
      user: {
        id: string
        email: string
        fullName: string
        phone: string
        organization?: string
      }
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.data?.token) {
      this.setToken(response.data.token)
    }

    return response
  }

  async logout() {
    this.setToken(null)
    return this.request('/api/auth/logout', { method: 'POST' })
  }

  async verifyEmail(token: string) {
    return this.request<{ message: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, password: string) {
    return this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  }

  // User endpoints
  async getProfile() {
    return this.request<{
      id: string
      email: string
      fullName: string
      phone: string
      organization?: string
      emailVerified: boolean
      createdAt: string
      updatedAt: string
    }>('/api/users/me')
  }

  async updateProfile(data: {
    fullName?: string
    phone?: string
    organization?: string
  }) {
    return this.request('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/api/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  // Sportsground endpoints
  async getSportsgrounds() {
    return this.request<Array<{
      id: string
      name: string
      address: string
      latitude: number
      longitude: number
      defaultZoom: number
      notes?: string
      createdAt: string
      updatedAt: string
    }>>('/api/sportsgrounds')
  }

  async createSportsground(data: {
    name: string
    address: string
    latitude: number
    longitude: number
    defaultZoom?: number
    notes?: string
  }) {
    return this.request('/api/sportsgrounds', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getSportsground(id: string) {
    return this.request(`/api/sportsgrounds/${id}`)
  }

  async updateSportsground(id: string, data: Partial<{
    name: string
    address: string
    latitude: number
    longitude: number
    defaultZoom: number
    notes: string
  }>) {
    return this.request(`/api/sportsgrounds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSportsground(id: string) {
    return this.request(`/api/sportsgrounds/${id}`, { method: 'DELETE' })
  }

  // Template endpoints
  async getTemplates() {
    return this.request<Array<{
      id: string
      sport: string
      name: string
      description?: string
      minLength: number
      maxLength: number
      minWidth: number
      maxWidth: number
      defaultLength: number
      defaultWidth: number
      interiorElements: unknown
      isActive: boolean
    }>>('/api/templates')
  }

  async getTemplate(id: string) {
    return this.request(`/api/templates/${id}`)
  }

  // Configuration endpoints
  async getConfigurations(sportsgroundId?: string) {
    const query = sportsgroundId ? `?sportsgroundId=${sportsgroundId}` : ''
    return this.request<Array<{
      id: string
      name: string
      latitude: number
      longitude: number
      rotationDegrees: number
      lengthMeters: number
      widthMeters: number
      lineColor: string
      sportsground: { id: string; name: string; address: string }
      template: { id: string; name: string; sport: string }
      createdAt: string
      updatedAt: string
    }>>(`/api/configurations${query}`)
  }

  async createConfiguration(data: {
    sportsgroundId: string
    templateId: string
    name: string
    latitude: number
    longitude: number
    rotationDegrees: number
    lengthMeters: number
    widthMeters: number
    lineColor: string
  }) {
    return this.request('/api/configurations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getConfiguration(id: string) {
    return this.request(`/api/configurations/${id}`)
  }

  async updateConfiguration(id: string, data: Partial<{
    name: string
    latitude: number
    longitude: number
    rotationDegrees: number
    lengthMeters: number
    widthMeters: number
    lineColor: string
  }>) {
    return this.request(`/api/configurations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteConfiguration(id: string) {
    return this.request(`/api/configurations/${id}`, { method: 'DELETE' })
  }

  async duplicateConfiguration(id: string, name?: string) {
    return this.request(`/api/configurations/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  // Booking endpoints
  async getBookings(status?: string) {
    const query = status ? `?status=${status}` : ''
    return this.request<Array<{
      id: string
      referenceNumber: string
      preferredDate: string
      preferredTime: string
      alternativeDate?: string
      notes?: string
      contactPreference: string
      status: string
      configuration: {
        id: string
        name: string
        sportsground: { id: string; name: string; address: string }
        template: { id: string; name: string; sport: string }
      }
      createdAt: string
      updatedAt: string
    }>>(`/api/bookings${query}`)
  }

  async createBooking(data: {
    configurationId: string
    preferredDate: string
    preferredTime: string
    alternativeDate?: string
    notes?: string
    contactPreference: 'phone' | 'email'
  }) {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getBooking(id: string) {
    return this.request(`/api/bookings/${id}`)
  }

  async updateBooking(id: string, data: Partial<{
    preferredDate: string
    preferredTime: string
    alternativeDate: string
    notes: string
    contactPreference: 'phone' | 'email'
  }>) {
    return this.request(`/api/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async cancelBooking(id: string) {
    return this.request(`/api/bookings/${id}`, { method: 'DELETE' })
  }

  // Batch booking endpoints
  async createBatchBooking(data: {
    sportsgroundId: string
    configurations: Array<{
      configurationId: string
      preferredDate?: string
      preferredTime?: string
    }>
    defaultPreferredDate: string
    defaultPreferredTime: string
    alternativeDate?: string
    notes?: string
    contactPreference: 'phone' | 'email' | 'both'
  }) {
    return this.request<{
      bookingGroup: {
        id: string
        groupReferenceNumber: string
        status: string
        createdAt: string
      }
      bookings: Array<{
        id: string
        referenceNumber: string
        configurationId: string
        configurationName: string
        preferredDate: string
        preferredTime: string
      }>
    }>('/api/bookings/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getBookingGroup(id: string) {
    return this.request(`/api/bookings/groups/${id}`)
  }

  async cancelBookingGroup(id: string) {
    return this.request(`/api/bookings/groups/${id}`, { method: 'DELETE' })
  }
}

export const api = new ApiClient()
