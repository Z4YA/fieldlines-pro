'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface MaintenanceContextType {
  isMaintenanceMode: boolean
  isChecking: boolean
  checkMaintenanceStatus: () => Promise<void>
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined)

function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Under Maintenance
          </h1>
          <p className="text-gray-600 mb-6">
            We&apos;re currently performing scheduled maintenance to improve your experience.
            Please check back shortly.
          </p>
          <div className="text-sm text-gray-500">
            <p>Thank you for your patience.</p>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              If you&apos;re an administrator, please{' '}
              <a href="/login" className="text-green-600 hover:text-green-500 font-medium">
                log in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading, isAdmin } = useAuth()
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)

  const checkMaintenanceStatus = useCallback(async () => {
    try {
      const response = await api.getMaintenanceStatus()
      if (response.data) {
        setIsMaintenanceMode(response.data.maintenanceMode)
      }
    } catch (error) {
      console.error('Failed to check maintenance status:', error)
      // If we can't check, assume not in maintenance mode
      setIsMaintenanceMode(false)
    } finally {
      setIsChecking(false)
      setHasChecked(true)
    }
  }, [])

  useEffect(() => {
    checkMaintenanceStatus()

    // Re-check every 30 seconds
    const interval = setInterval(checkMaintenanceStatus, 30000)
    return () => clearInterval(interval)
  }, [checkMaintenanceStatus])

  // Show loading while checking auth and maintenance status
  if (isChecking || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // If maintenance mode is on and user is not an admin, show maintenance page
  // Allow: admins, super_admins, or if no user is logged in (so they can log in)
  if (isMaintenanceMode && hasChecked) {
    // If user is logged in but not admin, show maintenance page
    if (user && !isAdmin) {
      return <MaintenancePage />
    }
    // If not logged in, show maintenance page except on login/auth pages
    if (!user && typeof window !== 'undefined') {
      const path = window.location.pathname
      const allowedPaths = ['/login', '/admin/register', '/forgot-password', '/reset-password']
      const isAllowedPath = allowedPaths.some(p => path.startsWith(p))
      if (!isAllowedPath) {
        return <MaintenancePage />
      }
    }
  }

  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenanceMode,
        isChecking,
        checkMaintenanceStatus,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  )
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext)
  if (context === undefined) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider')
  }
  return context
}
