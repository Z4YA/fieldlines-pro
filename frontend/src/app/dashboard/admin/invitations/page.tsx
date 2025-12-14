'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface Invitation {
  id: string
  email: string
  token: string
  expiresAt: string
  acceptedAt?: string
  createdAt: string
  invitedBy: {
    fullName: string
    email: string
  }
}

export default function AdminInvitationsPage() {
  const router = useRouter()
  const { isSuperAdmin } = useAuth()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/dashboard/admin')
      return
    }
    fetchInvitations()
  }, [isSuperAdmin, router])

  const fetchInvitations = async () => {
    setIsLoading(true)
    const response = await api.getAdminInvitations()
    if (response.data) {
      setInvitations(response.data)
    }
    setIsLoading(false)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    const response = await api.createAdminInvitation(email)
    if (response.error) {
      setError(response.error)
    } else {
      setSuccess(`Invitation sent to ${email}`)
      setEmail('')
      fetchInvitations()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return
    }
    setDeletingId(id)
    const response = await api.deleteAdminInvitation(id)
    if (!response.error) {
      setInvitations((prev) => prev.filter((inv) => inv.id !== id))
    }
    setDeletingId(null)
  }

  const getInvitationStatus = (invitation: Invitation) => {
    if (invitation.acceptedAt) {
      return { label: 'Accepted', style: 'bg-green-100 text-green-800' }
    }
    if (new Date(invitation.expiresAt) < new Date()) {
      return { label: 'Expired', style: 'bg-red-100 text-red-800' }
    }
    return { label: 'Pending', style: 'bg-yellow-100 text-yellow-800' }
  }

  if (!isSuperAdmin) {
    return null
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Invitations</h1>
        <p className="text-gray-600">Invite new administrators to the platform</p>
      </div>

      {/* Invite Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Send New Invitation</h2>
        <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="email"
              placeholder="Enter email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors inline-flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Invitation
              </>
            )}
          </button>
        </form>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}
      </div>

      {/* Invitations List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Sent Invitations</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invited By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invitations.map((invitation) => {
                  const status = getInvitationStatus(invitation)
                  return (
                    <tr key={invitation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{invitation.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.style}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">{invitation.invitedBy.fullName}</p>
                        <p className="text-sm text-gray-500">{invitation.invitedBy.email}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {invitation.acceptedAt ? (
                          <span className="text-green-600">
                            Accepted on {new Date(invitation.acceptedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          new Date(invitation.expiresAt).toLocaleDateString()
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!invitation.acceptedAt && new Date(invitation.expiresAt) > new Date() && (
                          <button
                            onClick={() => handleDelete(invitation.id)}
                            disabled={deletingId === invitation.id}
                            className="px-3 py-1 border border-red-300 text-red-700 text-sm rounded hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === invitation.id ? '...' : 'Cancel'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {invitations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No invitations sent yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">How Invitations Work</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. Enter the email address of the person you want to invite as an admin</li>
          <li>2. They will receive an email with a registration link</li>
          <li>3. The link is valid for 7 days</li>
          <li>4. Once they complete registration, they will have admin access</li>
        </ul>
      </div>
    </div>
  )
}
