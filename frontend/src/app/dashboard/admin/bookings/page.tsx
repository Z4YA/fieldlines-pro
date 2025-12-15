'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

interface Booking {
  id: string
  referenceNumber: string
  preferredDate: string
  preferredTime: string
  status: string
  createdAt: string
  user: { id: string; fullName: string; email: string; phone: string }
  configuration: {
    id: string
    name: string
    sportsground: { id: string; name: string; address: string }
    template: { id: string; name: string; sport: string }
  }
}

type SortField = 'referenceNumber' | 'customer' | 'location' | 'preferredDate' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export default function AdminBookingsPage() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') || ''

  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [sortField, setSortField] = useState<SortField>('preferredDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const fetchBookings = async () => {
    setIsLoading(true)
    const response = await api.getAdminBookings({
      page: pagination.page,
      status: statusFilter || undefined,
      search: searchQuery || undefined,
    })
    if (response.data) {
      setBookings(response.data.bookings)
      setPagination(response.data.pagination)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [pagination.page, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchBookings()
  }

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId)
    const response = await api.updateBookingStatus(bookingId, newStatus)
    if (!response.error) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      )
    }
    setUpdatingId(null)
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'referenceNumber':
          comparison = a.referenceNumber.localeCompare(b.referenceNumber)
          break
        case 'customer':
          comparison = a.user.fullName.localeCompare(b.user.fullName)
          break
        case 'location':
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
  }, [bookings, sortField, sortDirection])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
        <p className="text-gray-600">View and manage all bookings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by reference, customer, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Search
          </button>
          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 ${viewMode === 'cards' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              title="Card View"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 ${viewMode === 'table' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              title="Table View"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Bookings Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No bookings found
        </div>
      ) : viewMode === 'cards' ? (
        /* Card View */
        <div className="space-y-4">
          {sortedBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm font-semibold text-gray-900">{booking.referenceNumber}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Customer</p>
                      <p className="font-medium text-gray-900">{booking.user.fullName}</p>
                      <p className="text-gray-600 text-xs">{booking.user.email}</p>
                      <p className="text-gray-600 text-xs">{booking.user.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="text-gray-900">{booking.configuration.sportsground.name}</p>
                      <p className="text-gray-600 text-xs">{booking.configuration.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Preferred Date</p>
                      <p className="text-gray-900">{new Date(booking.preferredDate).toLocaleDateString()}</p>
                      <p className="text-gray-600 text-xs capitalize">{booking.preferredTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Template</p>
                      <p className="text-gray-900">{booking.configuration.template.name}</p>
                      <p className="text-gray-600 text-xs capitalize">{booking.configuration.template.sport}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row md:flex-col gap-2 justify-end flex-shrink-0">
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(booking.id, 'confirmed')}
                      disabled={updatingId === booking.id}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatingId === booking.id ? '...' : 'Confirm'}
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange(booking.id, 'completed')}
                      disabled={updatingId === booking.id}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {updatingId === booking.id ? '...' : 'Complete'}
                    </button>
                  )}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button
                      onClick={() => handleStatusChange(booking.id, 'cancelled')}
                      disabled={updatingId === booking.id}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                  <Link
                    href={`/dashboard/admin/bookings/${booking.id}`}
                    className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 text-center"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('referenceNumber')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Reference</span>
                      <SortIcon field="referenceNumber" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('customer')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Customer</span>
                      <SortIcon field="customer" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Location</span>
                      <SortIcon field="location" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('preferredDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date/Time</span>
                      <SortIcon field="preferredDate" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm">{booking.referenceNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{booking.user.fullName}</p>
                        <p className="text-sm text-gray-500">{booking.user.email}</p>
                        <p className="text-sm text-gray-500">{booking.user.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{booking.configuration.sportsground.name}</p>
                      <p className="text-sm text-gray-500">{booking.configuration.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">
                        {new Date(booking.preferredDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">{booking.preferredTime}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'confirmed')}
                            disabled={updatingId === booking.id}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updatingId === booking.id ? '...' : 'Confirm'}
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'completed')}
                            disabled={updatingId === booking.id}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {updatingId === booking.id ? '...' : 'Complete'}
                          </button>
                        )}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'cancelled')}
                            disabled={updatingId === booking.id}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                        <Link
                          href={`/dashboard/admin/bookings/${booking.id}`}
                          className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination.pages > 1 && (
        <div className="mt-4 bg-white rounded-lg shadow px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
