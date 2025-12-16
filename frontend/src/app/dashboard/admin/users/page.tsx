'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface User {
  id: string
  fullName: string
  email: string
  phone: string
  organization?: string
  role: string
  emailVerified: boolean
  suspended: boolean
  suspendedAt: string | null
  createdAt: string
  _count: {
    sportsgrounds: number
    bookings: number
  }
}

type SortField = 'fullName' | 'email' | 'organization' | 'role' | 'status' | 'activity' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export default function AdminUsersPage() {
  const { isAdmin, isSuperAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)
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

  // Auto-hide action message
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [actionMessage])

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
    if (!isAdmin) return
    setUpdatingId(userId)
    const response = await api.updateUserRole(userId, newRole)
    if (!response.error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    }
    setUpdatingId(null)
  }

  // Check if current user can edit a specific user's role
  const canEditUserRole = (user: User) => {
    if (!isAdmin) return false
    // Super admins can edit anyone except other super admins
    if (isSuperAdmin) return user.role !== 'super_admin'
    // Regular admins can only edit regular users (not admins or super_admins)
    return user.role === 'user'
  }

  // Check if current user can perform actions on a specific user
  const canManageUser = (user: User) => {
    if (!isAdmin) return false
    // Super admins can manage anyone except other super admins
    if (isSuperAdmin) return user.role !== 'super_admin'
    // Regular admins can only manage regular users
    return user.role === 'user'
  }

  const handleSuspend = async (user: User) => {
    setOpenMenuId(null)
    setUpdatingId(user.id)
    const response = await api.suspendUser(user.id, !user.suspended)
    if (response.error) {
      setActionMessage({ type: 'error', text: response.error })
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, suspended: !user.suspended, suspendedAt: !user.suspended ? new Date().toISOString() : null }
            : u
        )
      )
      setActionMessage({
        type: 'success',
        text: user.suspended ? `${user.fullName} has been unsuspended` : `${user.fullName} has been suspended`,
      })
    }
    setUpdatingId(null)
  }

  const handlePasswordReset = async (user: User) => {
    setOpenMenuId(null)
    setUpdatingId(user.id)
    const response = await api.sendPasswordReset(user.id)
    if (response.error) {
      setActionMessage({ type: 'error', text: response.error })
    } else {
      setActionMessage({ type: 'success', text: `Password reset email sent to ${user.email}` })
    }
    setUpdatingId(null)
  }

  const handleResendVerification = async (user: User) => {
    setOpenMenuId(null)
    setUpdatingId(user.id)
    const response = await api.resendVerificationEmail(user.id)
    if (response.error) {
      setActionMessage({ type: 'error', text: response.error })
    } else {
      setActionMessage({ type: 'success', text: `Verification email sent to ${user.email}` })
    }
    setUpdatingId(null)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setUpdatingId(deleteConfirm.id)
    const response = await api.deleteUser(deleteConfirm.id)
    if (response.error) {
      setActionMessage({ type: 'error', text: response.error })
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id))
      setActionMessage({ type: 'success', text: `${deleteConfirm.fullName} has been deleted` })
    }
    setDeleteConfirm(null)
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
        case 'organization':
          comparison = (a.organization || '').localeCompare(b.organization || '')
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

  const ActionsMenu = ({ user }: { user: User }) => {
    const isOpen = openMenuId === user.id
    const canManage = canManageUser(user)

    if (!canManage) {
      return (
        <Link
          href={`/dashboard/admin/users/${user.id}`}
          className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
        >
          View Details
        </Link>
      )
    }

    return (
      <div className="relative" ref={isOpen ? menuRef : null}>
        <button
          onClick={() => setOpenMenuId(isOpen ? null : user.id)}
          disabled={updatingId === user.id}
          className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
        >
          Actions
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
            <div className="py-1">
              <Link
                href={`/dashboard/admin/users/${user.id}`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                View Details
              </Link>
              <button
                onClick={() => handleSuspend(user)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {user.suspended ? 'Unsuspend User' : 'Suspend User'}
              </button>
              <button
                onClick={() => handlePasswordReset(user)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Send Password Reset
              </button>
              {!user.emailVerified && (
                <button
                  onClick={() => handleResendVerification(user)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Resend Verification
                </button>
              )}
              <hr className="my-1" />
              <button
                onClick={() => {
                  setOpenMenuId(null)
                  setDeleteConfirm(user)
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete User
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const UserStatus = ({ user }: { user: User }) => (
    <div className="flex flex-col gap-1">
      {user.suspended ? (
        <span className="inline-flex items-center text-red-600 text-xs">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
          Suspended
        </span>
      ) : user.emailVerified ? (
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
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">View and manage platform users</p>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            actionMessage.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete User</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteConfirm.fullName}</strong> ({deleteConfirm.email})?
              This will permanently remove all their data including sportsgrounds, configurations, and bookings.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={updatingId === deleteConfirm.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {updatingId === deleteConfirm.id ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div key={user.id} className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow ${user.suspended ? 'border-l-4 border-red-500' : ''}`}>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 ${user.suspended ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
                      <span className={`${user.suspended ? 'text-red-600' : 'text-green-600'} font-semibold text-lg`}>
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{user.fullName}</h3>
                      <div className="flex items-center gap-2">
                        {canEditUserRole(user) ? (
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
                        <UserStatus user={user} />
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Contact</p>
                      <p className="text-gray-900">{user.email}</p>
                      <p className="text-gray-600 text-xs">{user.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Organization</p>
                      <p className="text-gray-900">{user.organization || '-'}</p>
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
                  <ActionsMenu user={user} />
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
                    onClick={() => handleSort('organization')}
                  >
                    <div className="flex items-center gap-1">
                      Organization
                      <SortIcon field="organization" />
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
                  <tr key={user.id} className={`hover:bg-gray-50 ${user.suspended ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 ${user.suspended ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
                          <span className={`${user.suspended ? 'text-red-600' : 'text-green-600'} font-semibold`}>
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
                      <p className="text-gray-900">{user.organization || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {canEditUserRole(user) ? (
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
                      <UserStatus user={user} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{user._count.sportsgrounds} sportsgrounds</p>
                      <p className="text-sm text-gray-500">{user._count.bookings} bookings</p>
                    </td>
                    <td className="px-6 py-4">
                      <ActionsMenu user={user} />
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
