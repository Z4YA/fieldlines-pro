'use client'

import { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'

interface Configuration {
  id: string
  name: string
  createdAt: string
  user: {
    id: string
    fullName: string
    email: string
  }
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
  _count: {
    bookings: number
  }
}

type SortField = 'name' | 'sportsground' | 'template' | 'owner' | 'bookings' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export default function AdminConfigurationsPage() {
  const [configurations, setConfigurations] = useState<Configuration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Default to card view on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode('cards')
    }
  }, [])

  const fetchConfigurations = async () => {
    setIsLoading(true)
    const response = await api.getAdminConfigurations({
      page: pagination.page,
      search: searchQuery || undefined,
    })
    if (response.data) {
      setConfigurations(response.data.configurations)
      setPagination(response.data.pagination)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchConfigurations()
  }, [pagination.page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchConfigurations()
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedConfigurations = useMemo(() => {
    return [...configurations].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'sportsground':
          comparison = a.sportsground.name.localeCompare(b.sportsground.name)
          break
        case 'template':
          comparison = a.template.name.localeCompare(b.template.name)
          break
        case 'owner':
          comparison = a.user.fullName.localeCompare(b.user.fullName)
          break
        case 'bookings':
          comparison = a._count.bookings - b._count.bookings
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [configurations, sortField, sortDirection])

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
        <h1 className="text-2xl font-bold text-gray-900">Configurations</h1>
        <p className="text-gray-600">View all field configurations on the platform</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by name, sportsground, or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
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

      {/* Configurations Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : configurations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No configurations found
        </div>
      ) : viewMode === 'cards' ? (
        /* Card View */
        <div className="space-y-4">
          {sortedConfigurations.map((config) => (
            <div key={config.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-medium text-gray-900">{config.name}</h3>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                      {config._count.bookings} booking{config._count.bookings !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Sportsground</p>
                      <p className="text-gray-900">{config.sportsground.name}</p>
                      <p className="text-gray-600 text-xs">{config.sportsground.address}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Template</p>
                      <p className="text-gray-900">{config.template.name}</p>
                      <p className="text-gray-600 text-xs capitalize">{config.template.sport}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Owner</p>
                      <p className="text-gray-900">{config.user.fullName}</p>
                      <p className="text-gray-600 text-xs">{config.user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="text-gray-900">{new Date(config.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
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
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Configuration
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('sportsground')}
                  >
                    <div className="flex items-center gap-1">
                      Sportsground
                      <SortIcon field="sportsground" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('template')}
                  >
                    <div className="flex items-center gap-1">
                      Template
                      <SortIcon field="template" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('owner')}
                  >
                    <div className="flex items-center gap-1">
                      Owner
                      <SortIcon field="owner" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('bookings')}
                  >
                    <div className="flex items-center gap-1">
                      Bookings
                      <SortIcon field="bookings" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      <SortIcon field="createdAt" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedConfigurations.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{config.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{config.sportsground.name}</p>
                      <p className="text-sm text-gray-500">{config.sportsground.address}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{config.template.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{config.template.sport}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{config.user.fullName}</p>
                      <p className="text-sm text-gray-500">{config.user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                        {config._count.bookings} booking{config._count.bookings !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(config.createdAt).toLocaleDateString()}
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
