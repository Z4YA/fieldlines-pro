'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api'

interface BookingDetail {
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
}

export default function AdminBookingDetailPage() {
  const params = useParams()
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    const fetchBooking = async () => {
      const response = await api.getAdminBooking(params.id as string)
      if (response.data) {
        setBooking(response.data)
      } else {
        setError(response.error || 'Failed to load booking')
      }
      setIsLoading(false)
    }
    fetchBooking()
  }, [params.id])

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return
    setUpdatingStatus(true)
    const response = await api.updateBookingStatus(booking.id, newStatus)
    if (!response.error) {
      setBooking({ ...booking, status: newStatus })
    }
    setUpdatingStatus(false)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error || 'Booking not found'}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/admin/bookings"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Bookings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-gray-500 font-mono">{booking.referenceNumber}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${getStatusBadge(booking.status)}`}>
            {booking.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="font-medium text-gray-900">{booking.user.fullName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium text-gray-900">{booking.user.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p className="font-medium text-gray-900">{booking.user.phone}</p>
              </div>
              <div>
                <Link
                  href={`/dashboard/admin/users/${booking.user.id}`}
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                >
                  View User Profile →
                </Link>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Preferred Date</label>
                <p className="font-medium text-gray-900">
                  {new Date(booking.preferredDate).toLocaleDateString('en-AU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Preferred Time</label>
                <p className="font-medium text-gray-900">{booking.preferredTime}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Created</label>
                <p className="font-medium text-gray-900">
                  {new Date(booking.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Updated</label>
                <p className="font-medium text-gray-900">
                  {new Date(booking.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
            {booking.notes && (
              <div className="mt-4">
                <label className="text-sm text-gray-500">Notes</label>
                <p className="font-medium text-gray-900 whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Location & Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location & Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Sportsground</label>
                <p className="font-medium text-gray-900">{booking.configuration.sportsground.name}</p>
                <p className="text-sm text-gray-500">{booking.configuration.sportsground.address}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Configuration</label>
                <p className="font-medium text-gray-900">{booking.configuration.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Template</label>
                <p className="font-medium text-gray-900">{booking.configuration.template.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Sport</label>
                <p className="font-medium text-gray-900 capitalize">{booking.configuration.template.sport}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Status Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
            <div className="space-y-3">
              {booking.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusChange('confirmed')}
                    disabled={updatingStatus}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {updatingStatus ? 'Updating...' : 'Confirm Booking'}
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={updatingStatus}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {updatingStatus ? 'Updating...' : 'Cancel Booking'}
                  </button>
                </>
              )}
              {booking.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    disabled={updatingStatus}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {updatingStatus ? 'Updating...' : 'Mark as Completed'}
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={updatingStatus}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {updatingStatus ? 'Updating...' : 'Cancel Booking'}
                  </button>
                </>
              )}
              {(booking.status === 'completed' || booking.status === 'cancelled') && (
                <p className="text-gray-500 text-center text-sm">
                  This booking has been {booking.status}. No further actions available.
                </p>
              )}
            </div>
          </div>

          {/* Status History (placeholder) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-2 h-2 mt-2 bg-gray-400 rounded-full"></div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Booking Created</p>
                  <p className="text-xs text-gray-500">
                    {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {booking.status !== 'pending' && (
                <div className="flex items-start">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    booking.status === 'cancelled' ? 'bg-red-400' :
                    booking.status === 'completed' ? 'bg-green-400' : 'bg-blue-400'
                  }`}></div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {booking.status}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(booking.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
