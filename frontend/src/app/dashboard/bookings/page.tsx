'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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

type SortField = 'referenceNumber' | 'configuration' | 'sportsground' | 'preferredDate' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchFilter, setSearchFilter] = useState('')
  const [sportsgroundFilter, setSportsgroundFilter] = useState<string>('')
  const [timeFilter, setTimeFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [sortField, setSortField] = useState<SortField>('preferredDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
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

  // Extract unique sportsgrounds for filter dropdown
  const sportsgrounds = useMemo(() => {
    const uniqueSportsgrounds = new Map<string, { id: string; name: string }>()
    bookings.forEach((booking) => {
      if (booking.configuration.sportsground.id) {
        uniqueSportsgrounds.set(booking.configuration.sportsground.id, {
          id: booking.configuration.sportsground.id,
          name: booking.configuration.sportsground.name,
        })
      }
    })
    return Array.from(uniqueSportsgrounds.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [bookings])

  // Filter and sort bookings
  const filteredAndSortedBookings = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const filtered = bookings.filter((booking) => {
      // Status filter
      if (statusFilter !== 'all' && booking.status !== statusFilter) {
        return false
      }

      // Search filter
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase()
        const matchesSearch =
          booking.referenceNumber.toLowerCase().includes(searchLower) ||
          booking.configuration.name.toLowerCase().includes(searchLower) ||
          booking.configuration.sportsground.name.toLowerCase().includes(searchLower) ||
          booking.configuration.template.name.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Sportsground filter
      if (sportsgroundFilter && booking.configuration.sportsground.id !== sportsgroundFilter) {
        return false
      }

      // Time filter
      if (timeFilter !== 'all') {
        const bookingDate = new Date(booking.preferredDate)
        bookingDate.setHours(0, 0, 0, 0)
        if (timeFilter === 'upcoming' && bookingDate < today) return false
        if (timeFilter === 'past' && bookingDate >= today) return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'referenceNumber':
          comparison = a.referenceNumber.localeCompare(b.referenceNumber)
          break
        case 'configuration':
          comparison = a.configuration.name.localeCompare(b.configuration.name)
          break
        case 'sportsground':
          comparison = a.configuration.sportsground.name.localeCompare(b.configuration.sportsground.name)
          break
        case 'preferredDate':
          comparison = new Date(a.preferredDate).getTime() - new Date(b.preferredDate).getTime()
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [bookings, statusFilter, searchFilter, sportsgroundFilter, timeFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">Manage your line marking service requests</p>
        </div>
        <Link href="/dashboard/configurations">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </Button>
        </Link>
      </div>

      {/* Filters Row */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Sportsground Filter */}
          <select
            value={sportsgroundFilter}
            onChange={(e) => setSportsgroundFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Sportsgrounds</option>
            {sportsgrounds.map((sg) => (
              <option key={sg.id} value={sg.id}>
                {sg.name}
              </option>
            ))}
          </select>

          {/* Time Filter */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 ${viewMode === 'cards' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              title="Card View"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 ${viewMode === 'table' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              title="Table View"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
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
      ) : filteredAndSortedBookings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matching bookings</h3>
            <p className="text-gray-500">Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('referenceNumber')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Reference</span>
                      <SortIcon field="referenceNumber" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('configuration')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Configuration</span>
                      <SortIcon field="configuration" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('sportsground')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Sportsground</span>
                      <SortIcon field="sportsground" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('preferredDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Preferred Date</span>
                      <SortIcon field="preferredDate" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Created</span>
                      <SortIcon field="createdAt" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{booking.referenceNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{booking.configuration.name}</div>
                      <div className="text-xs text-gray-500">
                        {booking.configuration.template.name} - {booking.configuration.lengthMeters}m x {booking.configuration.widthMeters}m
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{booking.configuration.sportsground.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(booking.preferredDate)}</div>
                      <div className="text-xs text-gray-500">{formatTime(booking.preferredTime)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_STYLES[booking.status]?.bg || 'bg-gray-100'
                        } ${STATUS_STYLES[booking.status]?.text || 'text-gray-800'}`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancellingId === booking.id}
                          >
                            {cancellingId === booking.id ? '...' : 'Cancel'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View */
        <div className="space-y-4">
          {filteredAndSortedBookings.map((booking) => (
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

      {/* Results count */}
      {!isLoading && bookings.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Showing {filteredAndSortedBookings.length} of {bookings.length} bookings
        </div>
      )}
    </div>
  )
}
