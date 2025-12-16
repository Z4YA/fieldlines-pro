'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface Sportsground {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  createdAt: string
  user: {
    id: string
    fullName: string
    email: string
  }
  _count: {
    configurations: number
  }
}

interface User {
  id: string
  fullName: string
  email: string
}

type SortField = 'name' | 'owner' | 'configurations' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export default function AdminSportsgroundsPage() {
  const [sportsgrounds, setSportsgrounds] = useState<Sportsground[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedSportsground, setSelectedSportsground] = useState<Sportsground | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    defaultZoom: 18,
    notes: ''
  })
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

  const fetchSportsgrounds = async () => {
    setIsLoading(true)
    const response = await api.getAdminSportsgrounds({
      page: pagination.page,
      search: searchQuery || undefined,
    })
    if (response.data) {
      setSportsgrounds(response.data.sportsgrounds)
      setPagination(response.data.pagination)
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
    fetchSportsgrounds()
    fetchUsers()
  }, [pagination.page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchSportsgrounds()
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedSportsgrounds = useMemo(() => {
    return [...sportsgrounds].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'owner':
          comparison = a.user.fullName.localeCompare(b.user.fullName)
          break
        case 'configurations':
          comparison = a._count.configurations - b._count.configurations
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [sportsgrounds, sortField, sortDirection])

  const resetForm = () => {
    setFormData({
      userId: '',
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      defaultZoom: 18,
      notes: ''
    })
    setError('')
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSportsground) return
    setError('')
    setIsSubmitting(true)

    const response = await api.updateAdminSportsground(selectedSportsground.id, {
      name: formData.name,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      defaultZoom: formData.defaultZoom,
      notes: formData.notes || undefined
    })

    if (response.error) {
      setError(response.error)
    } else {
      setSuccess('Sportsground updated successfully')
      setShowEditModal(false)
      setSelectedSportsground(null)
      resetForm()
      fetchSportsgrounds()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async () => {
    if (!selectedSportsground) return
    setIsSubmitting(true)

    const response = await api.deleteAdminSportsground(selectedSportsground.id)

    if (response.error) {
      setError(response.error)
    } else {
      setSuccess('Sportsground deleted successfully')
      setShowDeleteModal(false)
      setSelectedSportsground(null)
      fetchSportsgrounds()
    }
    setIsSubmitting(false)
  }

  const handleTransfer = async () => {
    if (!selectedSportsground || !transferUserId) return
    setError('')
    setIsSubmitting(true)

    const response = await api.updateAdminSportsground(selectedSportsground.id, {
      userId: transferUserId
    })

    if (response.error) {
      setError(response.error)
    } else {
      setSuccess(`Sportsground transferred successfully. All configurations have also been transferred.`)
      setShowTransferModal(false)
      setSelectedSportsground(null)
      setTransferUserId('')
      fetchSportsgrounds()
    }
    setIsSubmitting(false)
  }

  const openEditModal = (sg: Sportsground) => {
    setSelectedSportsground(sg)
    setFormData({
      userId: sg.user.id,
      name: sg.name,
      address: sg.address,
      latitude: sg.latitude || 0,
      longitude: sg.longitude || 0,
      defaultZoom: 18,
      notes: ''
    })
    setShowEditModal(true)
    setOpenMenuId(null)
  }

  const openDeleteModal = (sg: Sportsground) => {
    setSelectedSportsground(sg)
    setShowDeleteModal(true)
    setOpenMenuId(null)
  }

  const openTransferModal = (sg: Sportsground) => {
    setSelectedSportsground(sg)
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

  const ActionsMenu = ({ sg }: { sg: Sportsground }) => {
    const isOpen = openMenuId === sg.id

    return (
      <div className="relative" ref={isOpen ? menuRef : null}>
        <button
          onClick={() => setOpenMenuId(isOpen ? null : sg.id)}
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
                onClick={() => openEditModal(sg)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Edit Details
              </button>
              <button
                onClick={() => openTransferModal(sg)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Transfer Ownership
              </button>
              <hr className="my-1" />
              <button
                onClick={() => openDeleteModal(sg)}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete Sportsground
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sportsgrounds</h1>
          <p className="text-gray-600">Manage all sportsgrounds on the platform</p>
        </div>
        <Link
          href="/dashboard/admin/sportsgrounds/new"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Sportsground
        </Link>
      </div>

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
            placeholder="Search by name, address, or owner..."
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

      {/* Sportsgrounds Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : sportsgrounds.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No sportsgrounds found
        </div>
      ) : viewMode === 'cards' ? (
        /* Card View */
        <div className="space-y-4">
          {sortedSportsgrounds.map((sg) => (
            <div key={sg.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{sg.name}</h3>
                      <p className="text-sm text-gray-500">{sg.address}</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Owner</p>
                      <p className="text-gray-900">{sg.user.fullName}</p>
                      <p className="text-gray-600 text-xs">{sg.user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Configurations</p>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {sg._count.configurations} configuration{sg._count.configurations !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="text-gray-900">{new Date(sg.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <ActionsMenu sg={sg} />
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
                      Sportsground
                      <SortIcon field="name" />
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
                    onClick={() => handleSort('configurations')}
                  >
                    <div className="flex items-center gap-1">
                      Configurations
                      <SortIcon field="configurations" />
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
                {sortedSportsgrounds.map((sg) => (
                  <tr key={sg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{sg.name}</p>
                          <p className="text-sm text-gray-500">{sg.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{sg.user.fullName}</p>
                      <p className="text-sm text-gray-500">{sg.user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {sg._count.configurations} configuration{sg._count.configurations !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(sg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <ActionsMenu sg={sg} />
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
      {showEditModal && selectedSportsground && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Sportsground</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Zoom (1-22)</label>
                <input
                  type="number"
                  min="1"
                  max="22"
                  value={formData.defaultZoom}
                  onChange={(e) => setFormData({ ...formData, defaultZoom: parseInt(e.target.value) || 18 })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedSportsground(null); resetForm() }}
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
      {showDeleteModal && selectedSportsground && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Sportsground</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{selectedSportsground.name}</strong>?
              This will also delete {selectedSportsground._count.configurations} configuration(s) and all associated bookings.
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setSelectedSportsground(null); setError('') }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Sportsground'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && selectedSportsground && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transfer Ownership</h3>
            <p className="text-gray-600 mb-4">
              Transfer <strong>{selectedSportsground.name}</strong> to a different user.
              All configurations on this sportsground will also be transferred.
            </p>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Current Owner:</strong> {selectedSportsground.user.fullName} ({selectedSportsground.user.email})
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
                  .filter((u) => u.id !== selectedSportsground.user.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                  ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowTransferModal(false); setSelectedSportsground(null); setTransferUserId(''); setError('') }}
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
