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
        role: 'user' | 'admin' | 'super_admin'
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
      role: 'user' | 'admin' | 'super_admin'
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

  // ============ ADMIN ENDPOINTS ============

  // Admin - Validate invitation token
  async validateAdminInvitation(token: string) {
    return this.request<{
      valid: boolean
      email: string
      invitedBy: string
      expiresAt: string
    }>('/api/auth/admin/validate-invitation', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  }

  // Admin - Register with invitation
  async registerAdmin(data: {
    token: string
    fullName: string
    phone: string
    password: string
    organization?: string
  }) {
    return this.request<{ message: string; userId: string }>('/api/auth/admin/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Admin - Get dashboard stats
  async getAdminStats() {
    return this.request<{
      users: { total: number }
      bookings: { total: number; pending: number; confirmed: number; completed: number }
      sportsgrounds: { total: number }
      configurations: { total: number }
      recentBookings: Array<{
        id: string
        referenceNumber: string
        status: string
        user: { fullName: string; email: string }
        configuration: {
          sportsground: { name: string }
          template: { name: string }
        }
      }>
    }>('/api/admin/stats')
  }

  // Admin - Users
  async getAdminUsers(params?: { page?: number; limit?: number; search?: string; role?: string }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.search) query.set('search', params.search)
    if (params?.role) query.set('role', params.role)
    const queryString = query.toString()
    return this.request<{
      users: Array<{
        id: string
        email: string
        fullName: string
        phone: string
        organization?: string
        role: string
        emailVerified: boolean
        suspended: boolean
        suspendedAt: string | null
        createdAt: string
        lastLoginAt?: string
        _count: { sportsgrounds: number; configurations: number; bookings: number }
      }>
      pagination: { page: number; limit: number; total: number; pages: number }
    }>(`/api/admin/users${queryString ? `?${queryString}` : ''}`)
  }

  async getAdminUser(id: string) {
    return this.request<{
      id: string
      email: string
      fullName: string
      phone: string
      organization?: string
      role: string
      emailVerified: boolean
      createdAt: string
      updatedAt: string
      lastLoginAt?: string
      sportsgrounds: Array<{ id: string; name: string; address: string; createdAt: string }>
      configurations: Array<{
        id: string
        name: string
        lengthMeters: number
        widthMeters: number
        lineColor: string
        sportsground: { name: string }
        template: { name: string }
        createdAt: string
      }>
      bookings: Array<{
        id: string
        referenceNumber: string
        preferredDate: string
        preferredTime: string
        status: string
        createdAt: string
        configuration: { name: string; sportsground: { name: string } }
      }>
    }>(`/api/admin/users/${id}`)
  }

  async updateUserRole(id: string, role: string) {
    return this.request<{ id: string; email: string; fullName: string; role: string }>(
      `/api/admin/users/${id}/role`,
      { method: 'PUT', body: JSON.stringify({ role }) }
    )
  }

  async updateAdminUser(id: string, data: {
    fullName?: string
    email?: string
    phone?: string
    organization?: string | null
    role?: 'user' | 'admin' | 'super_admin'
  }) {
    return this.request<{
      id: string
      email: string
      fullName: string
      phone: string
      organization: string | null
      role: string
      emailVerified: boolean
      createdAt: string
      updatedAt: string
    }>(
      `/api/admin/users/${id}`,
      { method: 'PUT', body: JSON.stringify(data) }
    )
  }

  async suspendUser(id: string, suspended: boolean) {
    return this.request<{ id: string; email: string; fullName: string; suspended: boolean; suspendedAt: string | null }>(
      `/api/admin/users/${id}/suspend`,
      { method: 'PUT', body: JSON.stringify({ suspended }) }
    )
  }

  async deleteUser(id: string) {
    return this.request<{ message: string; user: { id: string; fullName: string; email: string } }>(
      `/api/admin/users/${id}`,
      { method: 'DELETE' }
    )
  }

  async sendPasswordReset(id: string) {
    return this.request<{ message: string }>(
      `/api/admin/users/${id}/reset-password`,
      { method: 'POST' }
    )
  }

  async resendVerificationEmail(id: string) {
    return this.request<{ message: string }>(
      `/api/admin/users/${id}/resend-verification`,
      { method: 'POST' }
    )
  }

  // Admin - Bookings
  async getAdminBookings(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.status) query.set('status', params.status)
    if (params?.search) query.set('search', params.search)
    const queryString = query.toString()
    return this.request<{
      bookings: Array<{
        id: string
        referenceNumber: string
        preferredDate: string
        preferredTime: string
        alternativeDate?: string
        notes?: string
        contactPreference: string
        status: string
        createdAt: string
        user: { id: string; fullName: string; email: string; phone: string }
        configuration: {
          id: string
          name: string
          lengthMeters: number
          widthMeters: number
          lineColor: string
          sportsground: { id: string; name: string; address: string }
          template: { id: string; name: string; sport: string }
        }
      }>
      pagination: { page: number; limit: number; total: number; pages: number }
    }>(`/api/admin/bookings${queryString ? `?${queryString}` : ''}`)
  }

  async getAdminBooking(id: string) {
    return this.request<{
      id: string
      referenceNumber: string
      preferredDate: string
      preferredTime: string
      status: string
      notes: string | null
      createdAt: string
      updatedAt: string
      user: {
        id: string
        fullName: string
        email: string
        phone: string
      }
      configuration: {
        id: string
        name: string
        selectedMarkers: unknown
        sportsground: {
          id: string
          name: string
          address: string
        }
        template: {
          id: string
          name: string
          sport: string
        }
      }
    }>(`/api/admin/bookings/${id}`)
  }

  async updateBookingStatus(id: string, status: string) {
    return this.request(`/api/admin/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  // Admin - Calendar bookings
  async getAdminCalendarBookings(params: {
    startDate: string
    endDate: string
    status?: string
    sportsgroundId?: string
    configurationId?: string
    userId?: string
  }) {
    const query = new URLSearchParams()
    query.set('startDate', params.startDate)
    query.set('endDate', params.endDate)
    if (params.status) query.set('status', params.status)
    if (params.sportsgroundId) query.set('sportsgroundId', params.sportsgroundId)
    if (params.configurationId) query.set('configurationId', params.configurationId)
    if (params.userId) query.set('userId', params.userId)

    return this.request<{
      bookings: Array<{
        id: string
        referenceNumber: string
        preferredDate: string
        preferredTime: string
        status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
        notes: string | null
        user: { id: string; fullName: string; email: string }
        configuration: {
          id: string
          name: string
          sportsground: { id: string; name: string }
          template: { id: string; name: string; sport: string }
        }
      }>
    }>(`/api/admin/bookings/calendar?${query.toString()}`)
  }

  // Admin - Create booking
  async createAdminBooking(data: {
    userId: string
    configurationId: string
    preferredDate: string
    preferredTime: string
    alternativeDate?: string
    notes?: string
    contactPreference: 'phone' | 'email'
  }) {
    return this.request<{
      id: string
      referenceNumber: string
      preferredDate: string
      preferredTime: string
      status: string
      user: { id: string; fullName: string; email: string }
      configuration: {
        id: string
        name: string
        sportsground: { id: string; name: string }
        template: { id: string; name: string; sport: string }
      }
    }>('/api/admin/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Admin - Update booking (full update)
  async updateAdminBooking(id: string, data: {
    preferredDate?: string
    preferredTime?: string
    alternativeDate?: string | null
    status?: string
    notes?: string
    configurationId?: string
  }) {
    return this.request<{
      id: string
      referenceNumber: string
      preferredDate: string
      preferredTime: string
      status: string
      user: { id: string; fullName: string; email: string }
      configuration: {
        id: string
        name: string
        sportsground: { id: string; name: string }
        template: { id: string; name: string; sport: string }
      }
    }>(`/api/admin/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Admin - Sportsgrounds
  async getAdminSportsgrounds(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.search) query.set('search', params.search)
    const queryString = query.toString()
    return this.request<{
      sportsgrounds: Array<{
        id: string
        name: string
        address: string
        latitude: number
        longitude: number
        createdAt: string
        user: { id: string; fullName: string; email: string; organization: string | null }
        _count: { configurations: number }
      }>
      pagination: { page: number; limit: number; total: number; pages: number }
    }>(`/api/admin/sportsgrounds${queryString ? `?${queryString}` : ''}`)
  }

  async getAdminSportsground(id: string) {
    return this.request<{
      id: string
      name: string
      address: string
      latitude: number
      longitude: number
      defaultZoom: number
      notes?: string
      createdAt: string
      user: { id: string; fullName: string; email: string }
      configurations: Array<{
        id: string
        name: string
        template: { id: string; name: string; sport: string }
      }>
    }>(`/api/admin/sportsgrounds/${id}`)
  }

  async createAdminSportsground(data: {
    userId: string
    name: string
    address: string
    latitude: number
    longitude: number
    defaultZoom?: number
    notes?: string
  }) {
    return this.request<{
      id: string
      name: string
      address: string
      latitude: number
      longitude: number
      user: { id: string; fullName: string; email: string }
      _count: { configurations: number }
    }>('/api/admin/sportsgrounds', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAdminSportsground(id: string, data: Partial<{
    userId: string
    name: string
    address: string
    latitude: number
    longitude: number
    defaultZoom: number
    notes: string
  }>) {
    return this.request<{
      id: string
      name: string
      address: string
      latitude: number
      longitude: number
      user: { id: string; fullName: string; email: string }
      _count: { configurations: number }
    }>(`/api/admin/sportsgrounds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAdminSportsground(id: string) {
    return this.request<{ message: string }>(`/api/admin/sportsgrounds/${id}`, { method: 'DELETE' })
  }

  // Admin - Configurations
  async getAdminConfigurations(params?: { page?: number; limit?: number; search?: string; sportsgroundId?: string }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.search) query.set('search', params.search)
    if (params?.sportsgroundId) query.set('sportsgroundId', params.sportsgroundId)
    const queryString = query.toString()
    return this.request<{
      configurations: Array<{
        id: string
        name: string
        lengthMeters: number
        widthMeters: number
        lineColor: string
        rotationDegrees: number
        createdAt: string
        user: { id: string; fullName: string; email: string; organization: string | null }
        sportsground: { id: string; name: string; address: string }
        template: { id: string; name: string; sport: string }
        _count: { bookings: number }
      }>
      pagination: { page: number; limit: number; total: number; pages: number }
    }>(`/api/admin/configurations${queryString ? `?${queryString}` : ''}`)
  }

  async getAdminConfiguration(id: string) {
    return this.request<{
      id: string
      name: string
      latitude: number
      longitude: number
      rotationDegrees: number
      lengthMeters: number
      widthMeters: number
      lineColor: string
      createdAt: string
      user: { id: string; fullName: string; email: string }
      sportsground: { id: string; name: string; address: string; userId: string }
      template: {
        id: string
        name: string
        sport: string
        minLength: number
        maxLength: number
        minWidth: number
        maxWidth: number
        defaultLength: number
        defaultWidth: number
      }
      _count: { bookings: number }
    }>(`/api/admin/configurations/${id}`)
  }

  async createAdminConfiguration(data: {
    userId: string
    sportsgroundId: string
    templateId: string
    name: string
    latitude: number
    longitude: number
    rotationDegrees?: number
    lengthMeters: number
    widthMeters: number
    lineColor?: string
  }) {
    return this.request<{
      id: string
      name: string
      user: { id: string; fullName: string; email: string }
      sportsground: { id: string; name: string; address: string }
      template: { id: string; name: string; sport: string }
      _count: { bookings: number }
    }>('/api/admin/configurations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAdminConfiguration(id: string, data: Partial<{
    userId: string
    sportsgroundId: string
    templateId: string
    name: string
    latitude: number
    longitude: number
    rotationDegrees: number
    lengthMeters: number
    widthMeters: number
    lineColor: string
  }>) {
    return this.request<{
      id: string
      name: string
      user: { id: string; fullName: string; email: string }
      sportsground: { id: string; name: string; address: string }
      template: { id: string; name: string; sport: string }
      _count: { bookings: number }
    }>(`/api/admin/configurations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAdminConfiguration(id: string) {
    return this.request<{ message: string }>(`/api/admin/configurations/${id}`, { method: 'DELETE' })
  }

  // Admin - Get users list for dropdowns (simplified)
  async getAdminUsersSimple() {
    return this.request<{
      users: Array<{
        id: string
        fullName: string
        email: string
        organization: string | null
      }>
      pagination: { page: number; limit: number; total: number; pages: number }
    }>('/api/admin/users?limit=1000')
  }

  // Admin - Templates (CRUD)
  async getAdminTemplates() {
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
      createdAt: string
      _count: { configurations: number }
    }>>('/api/admin/templates')
  }

  async createTemplate(data: {
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
    isActive?: boolean
  }) {
    return this.request('/api/admin/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTemplate(id: string, data: Partial<{
    sport: string
    name: string
    description: string
    minLength: number
    maxLength: number
    minWidth: number
    maxWidth: number
    defaultLength: number
    defaultWidth: number
    interiorElements: unknown
    isActive: boolean
  }>) {
    return this.request(`/api/admin/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTemplate(id: string) {
    return this.request(`/api/admin/templates/${id}`, { method: 'DELETE' })
  }

  // Admin - Admin Invitations
  async getAdminInvitations() {
    return this.request<Array<{
      id: string
      email: string
      token: string
      expiresAt: string
      acceptedAt?: string
      createdAt: string
      invitedBy: { fullName: string; email: string }
    }>>('/api/admin/invitations')
  }

  async createAdminInvitation(email: string) {
    return this.request<{
      message: string
      invitation: { id: string; email: string; expiresAt: string }
    }>('/api/admin/invitations', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async deleteAdminInvitation(id: string) {
    return this.request('/api/admin/invitations/' + id, { method: 'DELETE' })
  }

  // Admin - User Invitations
  async getUserInvitations() {
    return this.request<Array<{
      id: string
      email: string
      token: string
      expiresAt: string
      acceptedAt?: string
      createdAt: string
      invitedBy: { fullName: string; email: string }
    }>>('/api/admin/user-invitations')
  }

  async createUserInvitation(email: string) {
    return this.request<{
      message: string
      invitation: { id: string; email: string; expiresAt: string }
    }>('/api/admin/user-invitations', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async deleteUserInvitation(id: string) {
    return this.request('/api/admin/user-invitations/' + id, { method: 'DELETE' })
  }

  // User invitation registration
  async validateUserInvitation(token: string) {
    return this.request<{
      valid: boolean
      email: string
      invitedBy: string
      expiresAt: string
    }>('/api/auth/user/validate-invitation', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  }

  async registerWithInvitation(data: {
    token: string
    fullName: string
    phone: string
    password: string
    organization?: string
  }) {
    return this.request<{ message: string; userId: string }>('/api/auth/user/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Settings
  async getSettings() {
    return this.request<Record<string, string>>('/api/settings')
  }

  async updateSetting(key: string, value: string) {
    return this.request<{ key: string; value: string }>('/api/settings/' + key, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    })
  }

  // Maintenance mode (public endpoint, no auth required)
  async getMaintenanceStatus() {
    return this.request<{ maintenanceMode: boolean }>('/api/maintenance/status')
  }
}

export const api = new ApiClient()
