'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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

interface User {
  id: string
  fullName: string
  email: string
}

type SortField = 'name' | 'sportsground' | 'template' | 'owner' | 'bookings' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export default function AdminConfigurationsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [configurations, setConfigurations] = useState<Configuration[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Sportsground filter from URL
  const sportsgroundId = searchParams.get('sportsgroundId')
  const [filterSportsgroundName, setFilterSportsgroundName] = useState<string | null>(null)

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedConfiguration, setSelectedConfiguration] = useState<Configuration | null>(null)

  // Form states
  const [editName, setEditName] = useState('')
  const [transferUserId, setTransferUserId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Actions menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Default to card view on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode('cards')
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-hide success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const fetchConfigurations = async () => {
    setIsLoading(true)
    const response = await api.getAdminConfigurations({
      page: pagination.page,
      search: searchQuery || undefined,
      sportsgroundId: sportsgroundId || undefined,
    })
    if (response.data) {
      setConfigurations(response.data.configurations)
      setPagination(response.data.pagination)
      // Set filter name from first result if filtering by sportsground
      if (sportsgroundId && response.data.configurations.length > 0) {
        setFilterSportsgroundName(response.data.configurations[0].sportsground.name)
      } else if (!sportsgroundId) {
        setFilterSportsgroundName(null)
      }
    }
    setIsLoading(false)
  }

  const fetchUsers = async () => {
    const response = await api.getAdminUsersSimple()
    if (response.data) {
      setUsers(response.data.users)
    }
  }

  useEffect(() => {
    fetchConfigurations()
    fetchUsers()
  }, [pagination.page, sportsgroundId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchConfigurations()
  }

  const clearSportsgroundFilter = () => {
    router.push('/dashboard/admin/configurations')
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

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConfiguration) return
    setError('')
    setIsSubmitting(true)

    const response = await api.updateAdminConfiguration(selectedConfiguration.id, {
      name: editName
    })

    if (response.error) {
      setError(response.error)
    } else {
      setSuccess('Configuration updated successfully')
      setShowEditModal(false)
      setSelectedConfiguration(null)
      setEditName('')
      fetchConfigurations()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async () => {
    if (!selectedConfiguration) return
    setIsSubmitting(true)

    const response = await api.deleteAdminConfiguration(selectedConfiguration.id)

    if (response.error) {
      setError(response.error)
    } else {
      setSuccess('Configuration deleted successfully')
      setShowDeleteModal(false)
      setSelectedConfiguration(null)
      fetchConfigurations()
    }
    setIsSubmitting(false)
  }

  const handleTransfer = async () => {
    if (!selectedConfiguration || !transferUserId) return
    setError('')
    setIsSubmitting(true)

    const response = await api.updateAdminConfiguration(selectedConfiguration.id, {
      userId: transferUserId
    })

    if (response.error) {
      setError(response.error)
    } else {
      setSuccess('Configuration transferred successfully')
      setShowTransferModal(false)
      setSelectedConfiguration(null)
      setTransferUserId('')
      fetchConfigurations()
    }
    setIsSubmitting(false)
  }

  const openEditModal = (config: Configuration) => {
    setSelectedConfiguration(config)
    setEditName(config.name)
    setShowEditModal(true)
    setOpenMenuId(null)
  }

  const openDeleteModal = (config: Configuration) => {
    setSelectedConfiguration(config)
    setShowDeleteModal(true)
    setOpenMenuId(null)
  }

  const openTransferModal = (config: Configuration) => {
    setSelectedConfiguration(config)
    setTransferUserId('')
    setShowTransferModal(true)
    setOpenMenuId(null)
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
      <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const ActionsMenu = ({ config }: { config: Configuration }) => {
    const isOpen = openMenuId === config.id

    return (
      <div className="relative" ref={isOpen ? menuRef : null}>
        <button
          onClick={() => setOpenMenuId(isOpen ? null : config.id)}
          className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center gap-1"
        >
          Actions
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
            <div className="py-1">
              <button
                onClick={() => openEditModal(config)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit Name
              </button>
              <button
                onClick={() => openTransferModal(config)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Transfer Ownership
              </button>
              <hr className="my-1" />
              <button
                onClick={() => openDeleteModal(config)}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete Configuration
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurations</h1>
        <p className="text-gray-600">Manage all field configurations on the platform</p>
      </div>

      {/* Sportsground Filter Indicator */}
      {sportsgroundId && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-orange-800">
              Showing configurations for: <strong>{filterSportsgroundName || 'Loading...'}</strong>
            </span>
          </div>
          <button
            onClick={clearSportsgroundFilter}
            className="text-orange-600 hover:text-orange-800 text-sm font-medium flex items-center gap-1"
          >
            Clear filter
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

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

      {/* Info Card */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">About Configurations</p>
            <p className="mt-1">
              Configurations are created using the field editor where users place fields on the map.
              From here you can rename, transfer ownership, or delete existing configurations.
              To create a new configuration for a user, first create a sportsground for them, then they can use the field editor.
            </p>
          </div>
        </div>
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
                      <Link
                        href={`/dashboard/admin/sportsgrounds?search=${encodeURIComponent(config.sportsground.name)}`}
                        className="text-orange-600 hover:text-orange-800 hover:underline"
                      >
                        {config.sportsground.name}
                      </Link>
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
                <div className="flex items-center">
                  <ActionsMenu config={config} />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
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
                      <Link
                        href={`/dashboard/admin/sportsgrounds?search=${encodeURIComponent(config.sportsground.name)}`}
                        className="text-orange-600 hover:text-orange-800 hover:underline"
                      >
                        {config.sportsground.name}
                      </Link>
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
                    <td className="px-6 py-4">
                      <ActionsMenu config={config} />
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

      {/* Edit Modal */}
      {showEditModal && selectedConfiguration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Configuration</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Configuration Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedConfiguration(null); setEditName(''); setError('') }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedConfiguration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Configuration</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{selectedConfiguration.name}</strong>?
              This will also delete {selectedConfiguration._count.bookings} booking(s) associated with this configuration.
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedConfiguration(null); setError('') }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && selectedConfiguration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transfer Ownership</h3>
            <p className="text-gray-600 mb-4">
              Transfer <strong>{selectedConfiguration.name}</strong> to a different user.
            </p>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Current Owner:</strong> {selectedConfiguration.user.fullName} ({selectedConfiguration.user.email})
              </p>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Owner *</label>
              <select
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="">Select new owner...</option>
                {users
                  .filter((u) => u.id !== selectedConfiguration.user.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                  ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowTransferModal(false); setSelectedConfiguration(null); setTransferUserId(''); setError('') }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={isSubmitting || !transferUserId}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Transferring...' : 'Transfer Ownership'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
