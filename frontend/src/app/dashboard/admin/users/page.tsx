'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface User {
  id: string
  fullName: string
  email: string
  phone: string
  role: string
  emailVerified: boolean
  createdAt: string
  _count: {
    sportsgrounds: number
    bookings: number
  }
}

type SortField = 'fullName' | 'email' | 'role' | 'status' | 'activity' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export default function AdminUsersPage() {
  const { isSuperAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Default to card view on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode('cards')
    }
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    const response = await api.getAdminUsers({
      page: pagination.page,
      role: roleFilter || undefined,
      search: searchQuery || undefined,
    })
    if (response.data) {
      setUsers(response.data.users)
      setPagination(response.data.pagination)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, roleFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchUsers()
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) return
    setUpdatingId(userId)
    const response = await api.updateUserRole(userId, newRole)
    if (!response.error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    }
    setUpdatingId(null)
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'fullName':
          comparison = a.fullName.localeCompare(b.fullName)
          break
        case 'email':
          comparison = a.email.localeCompare(b.email)
          break
        case 'role':
          comparison = a.role.localeCompare(b.role)
          break
        case 'status':
          comparison = (a.emailVerified ? 1 : 0) - (b.emailVerified ? 1 : 0)
          break
        case 'activity':
          comparison = (a._count.sportsgrounds + a._count.bookings) - (b._count.sportsgrounds + b._count.bookings)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [users, sortField, sortDirection])

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
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">View and manage platform users</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
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

      {/* Users Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No users found
        </div>
      ) : viewMode === 'cards' ? (
        /* Card View */
        <div className="space-y-4">
          {sortedUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold text-lg">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{user.fullName}</h3>
                      <div className="flex items-center gap-2">
                        {isSuperAdmin && user.role !== 'super_admin' ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={updatingId === user.id}
                            className={`px-2 py-1 rounded text-sm font-medium ${getRoleBadge(user.role)} border-0 cursor-pointer disabled:opacity-50`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                            {formatRole(user.role)}
                          </span>
                        )}
                        {user.emailVerified ? (
                          <span className="inline-flex items-center text-green-600 text-xs">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-yellow-600 text-xs">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Unverified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Contact</p>
                      <p className="text-gray-900">{user.email}</p>
                      <p className="text-gray-600 text-xs">{user.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Activity</p>
                      <p className="text-gray-900">{user._count.sportsgrounds} sportsgrounds</p>
                      <p className="text-gray-600 text-xs">{user._count.bookings} bookings</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Joined</p>
                      <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Link
                    href={`/dashboard/admin/users/${user.id}`}
                    className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                  >
                    View Details
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
                    onClick={() => handleSort('fullName')}
                  >
                    <div className="flex items-center gap-1">
                      User
                      <SortIcon field="fullName" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-1">
                      Contact
                      <SortIcon field="email" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center gap-1">
                      Role
                      <SortIcon field="role" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('activity')}
                  >
                    <div className="flex items-center gap-1">
                      Activity
                      <SortIcon field="activity" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{user.fullName}</p>
                          <p className="text-sm text-gray-500">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      {isSuperAdmin && user.role !== 'super_admin' ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updatingId === user.id}
                          className={`px-2 py-1 rounded text-sm font-medium ${getRoleBadge(user.role)} border-0 cursor-pointer disabled:opacity-50`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                          {formatRole(user.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.emailVerified ? (
                        <span className="inline-flex items-center text-green-600 text-sm">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-yellow-600 text-sm">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{user._count.sportsgrounds} sportsgrounds</p>
                      <p className="text-sm text-gray-500">{user._count.bookings} bookings</p>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/admin/users/${user.id}`}
                        className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                      >
                        View Details
                      </Link>
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
