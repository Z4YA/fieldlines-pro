'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export default function AdminSettingsPage() {
  const { isSuperAdmin } = useAuth()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state for provider email
  const [providerEmail, setProviderEmail] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      const response = await api.getSettings()
      if (response.data) {
        setSettings(response.data)
        setProviderEmail(response.data.provider_email || '')
      } else if (response.error) {
        setError(response.error)
      }
      setIsLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSaveProviderEmail = async () => {
    setError('')
    setSuccess('')

    if (!providerEmail.trim()) {
      setError('Provider email is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(providerEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSaving(true)
    const response = await api.updateSetting('provider_email', providerEmail.trim())

    if (response.error) {
      setError(response.error)
    } else {
      setSuccess('Provider email updated successfully')
      setSettings({ ...settings, provider_email: providerEmail.trim() })
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500">Configure system-wide settings for the platform</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
            <p className="text-sm text-gray-500">Configure how booking notifications are sent</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fallback Provider Email
              </label>
              <p className="text-sm text-gray-500 mb-2">
                This email receives booking notifications when no admin users are configured in the system.
                All admin users automatically receive notifications for new bookings.
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={providerEmail}
                  onChange={(e) => setProviderEmail(e.target.value)}
                  placeholder="operations@example.com"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <button
                  onClick={handleSaveProviderEmail}
                  disabled={isSaving}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About Notifications</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>When a customer submits a new booking:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>All users with admin or super admin roles receive an email notification</li>
                  <li>If no admin users exist, the fallback provider email above is used</li>
                  <li>The customer also receives a confirmation email</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
