'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface UserDetail {
  id: string
  fullName: string
  email: string
  phone: string
  role: string
  emailVerified: boolean
  createdAt: string
  sportsgrounds: Array<{
    id: string
    name: string
    address: string
    createdAt: string
  }>
  bookings: Array<{
    id: string
    referenceNumber: string
    status: string
    preferredDate: string
    preferredTime: string
    createdAt: string
    configuration: {
      name: string
      sportsground: { name: string }
    }
  }>
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const { isSuperAdmin } = useAuth()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingRole, setUpdatingRole] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const response = await api.getAdminUser(params.id as string)
      if (response.data) {
        setUser(response.data)
      } else {
        setError(response.error || 'Failed to load user')
      }
      setIsLoading(false)
    }
    fetchUser()
  }, [params.id])

  const handleRoleChange = async (newRole: string) => {
    if (!user || !isSuperAdmin) return
    setUpdatingRole(true)
    const response = await api.updateUserRole(user.id, newRole)
    if (!response.error) {
      setUser({ ...user, role: newRole })
    }
    setUpdatingRole(false)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      user: 'bg-gray-100 text-gray-800',
      admin: 'bg-orange-100 text-orange-800',
      super_admin: 'bg-purple-100 text-purple-800',
    }
    return styles[role] || 'bg-gray-100 text-gray-800'
  }

  const formatRole = (role: string) => {
    return role === 'super_admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error || 'User not found'}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/admin/users"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-2xl font-semibold">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">{user.fullName}</h2>
              <p className="text-gray-500">{user.email}</p>
              <p className="text-gray-500">{user.phone}</p>
            </div>
          </div>
          <div className="text-right">
            {isSuperAdmin && user.role !== 'super_admin' ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Role:</span>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  disabled={updatingRole}
                  className={`px-3 py-1.5 rounded font-medium ${getRoleBadge(user.role)} border-0 cursor-pointer disabled:opacity-50`}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(user.role)}`}>
                {formatRole(user.role)}
              </span>
            )}
            <div className="mt-2">
              {user.emailVerified ? (
                <span className="inline-flex items-center text-green-600 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Email Verified
                </span>
              ) : (
                <span className="inline-flex items-center text-yellow-600 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Not Verified
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sportsgrounds */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Sportsgrounds ({user.sportsgrounds.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {user.sportsgrounds.length > 0 ? (
              user.sportsgrounds.map((sg) => (
                <div key={sg.id} className="p-4 hover:bg-gray-50">
                  <p className="font-medium text-gray-900">{sg.name}</p>
                  <p className="text-sm text-gray-500">{sg.address}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-gray-500 text-center">No sportsgrounds</div>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Bookings ({user.bookings.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {user.bookings.length > 0 ? (
              user.bookings.slice(0, 10).map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm text-gray-900">{booking.referenceNumber}</p>
                      <p className="text-sm text-gray-500">
                        {booking.configuration.sportsground.name} - {booking.configuration.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(booking.preferredDate).toLocaleDateString()} at {booking.preferredTime}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-gray-500 text-center">No bookings</div>
            )}
          </div>
          {user.bookings.length > 10 && (
            <div className="p-4 border-t border-gray-200 text-center">
              <Link
                href={`/dashboard/admin/bookings?userId=${user.id}`}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                View all {user.bookings.length} bookings
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
