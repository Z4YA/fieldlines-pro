'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from './api'

interface User {
  id: string
  email: string
  fullName: string
  phone: string
  organization?: string
  emailVerified: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: {
    email: string
    password: string
    fullName: string
    phone: string
    organization?: string
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = api.getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    const response = await api.getProfile()
    if (response.data) {
      setUser(response.data)
    } else {
      // Token invalid, clear it
      api.setToken(null)
      setUser(null)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password })
    if (response.error) {
      return { success: false, error: response.error }
    }
    if (response.data?.user) {
      setUser({
        ...response.data.user,
        emailVerified: true, // If they can login, email is verified
      })
    }
    return { success: true }
  }

  const register = async (data: {
    email: string
    password: string
    fullName: string
    phone: string
    organization?: string
  }) => {
    const response = await api.register(data)
    if (response.error) {
      return { success: false, error: response.error }
    }
    return { success: true }
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
