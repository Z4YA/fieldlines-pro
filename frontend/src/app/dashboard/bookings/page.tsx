'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Booking {
  id: string
  referenceNumber: string
  preferredDate: string
  alternateDate?: string
  preferredTime: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  configuration: {
    id: string
    name: string
    lengthMeters?: number
    widthMeters?: number
    lineColor?: string
    template: {
      id?: string
      name: string
      sport?: string
    }
    sportsground: {
      id?: string
      name: string
      address: string
    }
  }
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const fetchBookings = async () => {
    const response = await api.getBookings()
    if (response.data) {
      setBookings(response.data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking? Please note cancellations within 48 hours of the scheduled service may incur fees.')) {
      return
    }

    setCancellingId(id)
    const response = await api.cancelBooking(id)
    if (!response.error) {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
      )
    } else {
      alert(response.error)
    }
    setCancellingId(null)
  }

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true
    return booking.status === filter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    const timeMap: Record<string, string> = {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      flexible: 'Flexible',
    }
    return timeMap[time] || time
  }

  const getColorHex = (color: string): string => {
    const colorMap: Record<string, string> = {
      white: '#FFFFFF',
      yellow: '#FFFF00',
      blue: '#0066FF',
      orange: '#FF6600',
      red: '#FF0000',
      green: '#00FF00',
    }
    return colorMap[color.toLowerCase()] || '#FFFFFF'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">Manage your line marking service requests</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Link href="/dashboard/configurations">
            <Button>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-500 mb-6">
              Create a field configuration first, then book a line marking service.
            </p>
            <Link href="/dashboard/configurations">
              <Button>View Configurations</Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredBookings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {filter} bookings</h3>
            <p className="text-gray-500">Try a different filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.referenceNumber}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_STYLES[booking.status]?.bg || 'bg-gray-100'
                        } ${STATUS_STYLES[booking.status]?.text || 'text-gray-800'}`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Configuration</p>
                        <p className="text-gray-900 font-medium">{booking.configuration.name}</p>
                        <p className="text-gray-600 text-xs">
                          {booking.configuration.template.name} -{' '}
                          {booking.configuration.lengthMeters}m x {booking.configuration.widthMeters}m
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Location</p>
                        <p className="text-gray-900">{booking.configuration.sportsground.name}</p>
                        <p className="text-gray-600 text-xs truncate">
                          {booking.configuration.sportsground.address}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">Preferred Date</p>
                        <p className="text-gray-900">
                          {formatDate(booking.preferredDate)} - {formatTime(booking.preferredTime)}
                        </p>
                        {booking.alternateDate && (
                          <p className="text-gray-600 text-xs">
                            Alt: {formatDate(booking.alternateDate)}
                          </p>
                        )}
                      </div>

                      {booking.configuration.lineColor && (
                      <div>
                        <p className="text-gray-500">Line Color</p>
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded border border-gray-300 mr-2"
                            style={{ backgroundColor: getColorHex(booking.configuration.lineColor) }}
                          ></div>
                          <span className="text-gray-900 capitalize">
                            {booking.configuration.lineColor}
                          </span>
                        </div>
                      </div>
                    )}
                    </div>

                    {booking.notes && (
                      <div className="mt-3 text-sm">
                        <p className="text-gray-500">Notes</p>
                        <p className="text-gray-700 truncate">{booking.notes}</p>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-3">
                      Submitted: {new Date(booking.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 justify-end">
                    <Link href={`/dashboard/bookings/${booking.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                      >
                        {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
