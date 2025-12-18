'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, DatesSetArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import { api } from '@/lib/api'
import Link from 'next/link'

interface CalendarBooking {
  id: string
  referenceNumber: string
  preferredDate: string
  preferredTime: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes: string | null
  user: { id: string; fullName: string; email: string }
  configuration: {
    id: string
    name: string
    sportsground: { id: string; name: string }
    template: { id: string; name: string; sport: string }
  }
}

interface Sportsground {
  id: string
  name: string
}

interface Configuration {
  id: string
  name: string
  sportsground: { id: string; name: string }
}

interface User {
  id: string
  fullName: string
  email: string
  organization: string | null
}

const statusColors = {
  pending: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  completed: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
  cancelled: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
}

export default function AdminSchedulerPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [bookings, setBookings] = useState<CalendarBooking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'week' | 'month'>('week')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: getWeekStart(new Date()),
    end: getWeekEnd(new Date())
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [sportsgroundFilter, setSportsgroundFilter] = useState('')
  const [configurationFilter, setConfigurationFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [organizationFilter, setOrganizationFilter] = useState('')

  // Filter options
  const [sportsgrounds, setSportsgrounds] = useState<Sportsground[]>([])
  const [configurations, setConfigurations] = useState<Configuration[]>([])
  const [users, setUsers] = useState<User[]>([])

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createSlotData, setCreateSlotData] = useState<{ date: string; time: string } | null>(null)

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  const [mobileDate, setMobileDate] = useState(new Date())

  // Edit form state
  const [editForm, setEditForm] = useState({
    preferredDate: '',
    preferredTime: '',
    status: '',
    notes: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Create form state
  const [createForm, setCreateForm] = useState({
    userId: '',
    configurationId: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
    contactPreference: 'email' as 'phone' | 'email'
  })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [dateRange, statusFilter, sportsgroundFilter, configurationFilter, userFilter])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  function getWeekStart(date: Date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  function getWeekEnd(date: Date) {
    const d = getWeekStart(date)
    d.setDate(d.getDate() + 6)
    d.setHours(23, 59, 59, 999)
    return d
  }

  function getMonthStart(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  function getMonthEnd(date: Date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  }

  const fetchFilterOptions = async () => {
    const [sgRes, configRes, userRes] = await Promise.all([
      api.getAdminSportsgrounds({ limit: 1000 }),
      api.getAdminConfigurations({ limit: 1000 }),
      api.getAdminUsersSimple()
    ])

    if (sgRes.data) setSportsgrounds(sgRes.data.sportsgrounds)
    if (configRes.data) setConfigurations(configRes.data.configurations)
    if (userRes.data) setUsers(userRes.data.users)
  }

  const fetchBookings = async () => {
    setIsLoading(true)
    console.log('Fetching bookings for range:', {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString()
    })
    const response = await api.getAdminCalendarBookings({
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      status: statusFilter.length > 0 ? statusFilter.join(',') : undefined,
      sportsgroundId: sportsgroundFilter || undefined,
      configurationId: configurationFilter || undefined,
      userId: userFilter || undefined
    })

    console.log('Calendar bookings response:', response)
    if (response.data) {
      console.log('Bookings received:', response.data.bookings.length, response.data.bookings)
      setBookings(response.data.bookings)
    }
    setIsLoading(false)
  }

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setDateRange(prev => {
      // Only update if dates actually changed to prevent infinite loop
      if (prev.start.getTime() === arg.start.getTime() &&
          prev.end.getTime() === arg.end.getTime()) {
        return prev
      }
      return { start: arg.start, end: arg.end }
    })
  }, [])

  const handleEventClick = useCallback((info: EventClickArg) => {
    const booking = info.event.extendedProps.booking as CalendarBooking
    setSelectedBooking(booking)
    setEditForm({
      preferredDate: booking.preferredDate.split('T')[0],
      preferredTime: booking.preferredTime,
      status: booking.status,
      notes: booking.notes || ''
    })
    setShowBookingModal(true)
  }, [])

  const handleDateClick = useCallback((info: DateClickArg) => {
    const date = info.dateStr.split('T')[0]
    const time = info.date.getHours().toString().padStart(2, '0') + ':00'
    setCreateSlotData({ date, time })
    setCreateForm({
      userId: '',
      configurationId: '',
      preferredDate: date,
      preferredTime: time,
      notes: '',
      contactPreference: 'email'
    })
    setShowCreateModal(true)
  }, [])

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return

    setIsUpdating(true)
    setError('')

    const response = await api.updateAdminBooking(selectedBooking.id, {
      preferredDate: editForm.preferredDate,
      preferredTime: editForm.preferredTime,
      status: editForm.status,
      notes: editForm.notes || undefined
    })

    if (response.error) {
      setError(response.error)
    } else {
      setSuccess('Booking updated successfully')
      setShowBookingModal(false)
      setSelectedBooking(null)
      fetchBookings()
    }
    setIsUpdating(false)
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')

    const response = await api.createAdminBooking({
      userId: createForm.userId,
      configurationId: createForm.configurationId,
      preferredDate: createForm.preferredDate,
      preferredTime: createForm.preferredTime,
      notes: createForm.notes || undefined,
      contactPreference: createForm.contactPreference
    })

    if (response.error) {
      setError(response.error)
    } else {
      setSuccess('Booking created successfully')
      setShowCreateModal(false)
      setCreateSlotData(null)
      setCreateForm({
        userId: '',
        configurationId: '',
        preferredDate: '',
        preferredTime: '',
        notes: '',
        contactPreference: 'email'
      })
      fetchBookings()
    }
    setIsCreating(false)
  }

  // Filter bookings by organization (client-side)
  const filteredBookings = useMemo(() => {
    if (!organizationFilter) return bookings
    // Look up user's organization from users list
    const orgUserIds = new Set(users.filter(u => u.organization === organizationFilter).map(u => u.id))
    return bookings.filter(b => orgUserIds.has(b.user.id))
  }, [bookings, organizationFilter, users])

  const calendarEvents = useMemo(() => {
    // Map text-based time preferences to actual times
    const timeMap: Record<string, string> = {
      'flexible': '09:00',
      'morning': '09:00',
      'afternoon': '14:00',
      'evening': '18:00'
    }

    return filteredBookings.map(booking => {
      const dateStr = booking.preferredDate?.split('T')[0]

      // Check if preferredTime is a text value or actual time
      let timeStr = booking.preferredTime || '09:00'
      if (timeMap[timeStr.toLowerCase()]) {
        timeStr = timeMap[timeStr.toLowerCase()]
      }

      const [hours, minutes] = timeStr.split(':')
      const startDate = new Date(`${dateStr}T${hours}:${minutes}:00`)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour duration

      // Include the original time preference in the title if it's not a specific time
      const timeLabel = booking.preferredTime && !booking.preferredTime.includes(':')
        ? ` (${booking.preferredTime})`
        : ''

      return {
        id: booking.id,
        title: `${booking.referenceNumber} - ${booking.configuration?.name || 'Unknown'}${timeLabel}`,
        start: startDate,
        end: endDate,
        backgroundColor: statusColors[booking.status]?.bg || '#ccc',
        borderColor: statusColors[booking.status]?.border || '#999',
        textColor: statusColors[booking.status]?.text || '#333',
        extendedProps: { booking }
      }
    })
  }, [filteredBookings])

  // Filtered configurations based on sportsground
  const filteredConfigurations = useMemo(() => {
    if (!sportsgroundFilter) return configurations
    return configurations.filter(c => c.sportsground.id === sportsgroundFilter)
  }, [configurations, sportsgroundFilter])

  // Filtered users based on organization
  const filteredUsers = useMemo(() => {
    if (!organizationFilter) return users
    return users.filter(u => u.organization === organizationFilter)
  }, [users, organizationFilter])

  // Mobile day view bookings
  const mobileDayBookings = useMemo(() => {
    const dayStr = mobileDate.toISOString().split('T')[0]
    return filteredBookings.filter(b => b.preferredDate.split('T')[0] === dayStr)
      .sort((a, b) => a.preferredTime.localeCompare(b.preferredTime))
  }, [filteredBookings, mobileDate])

  const handleViewChange = (view: 'week' | 'month') => {
    setCurrentView(view)
    const calendarApi = calendarRef.current?.getApi()
    if (calendarApi) {
      calendarApi.changeView(view === 'week' ? 'timeGridWeek' : 'dayGridMonth')
    }
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // Mobile Day View
  if (isMobile) {
    return (
      <div className="pb-20">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Scheduler</h1>
          <p className="text-gray-600">View and manage bookings</p>
        </div>

        {/* Date Navigation */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileDate(new Date(mobileDate.getTime() - 86400000))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <p className="font-semibold">{mobileDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
              <p className="text-sm text-gray-500">{mobileDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <button
              onClick={() => setMobileDate(new Date(mobileDate.getTime() + 86400000))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setMobileDate(new Date())}
            className="w-full mt-2 text-sm text-orange-600 hover:text-orange-700"
          >
            Go to Today
          </button>
        </div>

        {/* Add Booking Button */}
        <button
          onClick={() => {
            setCreateSlotData({ date: mobileDate.toISOString().split('T')[0], time: '09:00' })
            setCreateForm({
              userId: '',
              configurationId: '',
              preferredDate: mobileDate.toISOString().split('T')[0],
              preferredTime: '09:00',
              notes: '',
              contactPreference: 'email'
            })
            setShowCreateModal(true)
          }}
          className="w-full mb-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Booking
        </button>

        {/* Day Bookings */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : mobileDayBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No bookings for this day
          </div>
        ) : (
          <div className="space-y-3">
            {mobileDayBookings.map(booking => (
              <div
                key={booking.id}
                onClick={() => {
                  setSelectedBooking(booking)
                  setEditForm({
                    preferredDate: booking.preferredDate.split('T')[0],
                    preferredTime: booking.preferredTime,
                    status: booking.status,
                    notes: booking.notes || ''
                  })
                  setShowBookingModal(true)
                }}
                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderLeft: `4px solid ${statusColors[booking.status].border}` }}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-gray-900">{booking.preferredTime}</p>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="text-sm font-medium text-gray-900">{booking.referenceNumber}</p>
                <p className="text-sm text-gray-600">{booking.configuration.name}</p>
                <p className="text-sm text-gray-500">{booking.user.fullName}</p>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {showBookingModal && selectedBooking && (
          <BookingModal
            booking={selectedBooking}
            editForm={editForm}
            setEditForm={setEditForm}
            onClose={() => { setShowBookingModal(false); setSelectedBooking(null); setError('') }}
            onSubmit={handleUpdateBooking}
            isUpdating={isUpdating}
            error={error}
          />
        )}

        {showCreateModal && (
          <CreateBookingModal
            createForm={createForm}
            setCreateForm={setCreateForm}
            users={users}
            sportsgrounds={sportsgrounds}
            configurations={filteredConfigurations}
            onSportsgroundChange={(id) => {
              setSportsgroundFilter(id)
              setCreateForm(f => ({ ...f, configurationId: '' }))
            }}
            onClose={() => { setShowCreateModal(false); setCreateSlotData(null); setError('') }}
            onSubmit={handleCreateBooking}
            isCreating={isCreating}
            error={error}
          />
        )}
      </div>
    )
  }

  // Desktop Calendar View
  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduler</h1>
          <p className="text-gray-600">View and manage bookings in calendar view</p>
        </div>
        <button
          onClick={() => {
            setCreateSlotData({ date: new Date().toISOString().split('T')[0], time: '09:00' })
            setCreateForm({
              userId: '',
              configurationId: '',
              preferredDate: new Date().toISOString().split('T')[0],
              preferredTime: '09:00',
              notes: '',
              contactPreference: 'email'
            })
            setShowCreateModal(true)
          }}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Booking
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* View Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => handleViewChange('week')}
                className={`flex-1 px-3 py-2 text-sm ${currentView === 'week' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Week
              </button>
              <button
                onClick={() => handleViewChange('month')}
                className={`flex-1 px-3 py-2 text-sm ${currentView === 'month' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter.join(',')}
              onChange={(e) => setStatusFilter(e.target.value ? e.target.value.split(',') : [])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending,confirmed">Active (Pending & Confirmed)</option>
            </select>
          </div>

          {/* Sportsground Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sportsground</label>
            <select
              value={sportsgroundFilter}
              onChange={(e) => {
                setSportsgroundFilter(e.target.value)
                setConfigurationFilter('')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="">All Sportsgrounds</option>
              {sportsgrounds.map(sg => (
                <option key={sg.id} value={sg.id}>{sg.name}</option>
              ))}
            </select>
          </div>

          {/* Configuration Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Configuration</label>
            <select
              value={configurationFilter}
              onChange={(e) => setConfigurationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="">All Configurations</option>
              {filteredConfigurations.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Requester Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requester</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="">All Requesters</option>
              {filteredUsers.map(u => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>

          {/* Organization Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
            <select
              value={organizationFilter}
              onChange={(e) => {
                setOrganizationFilter(e.target.value)
                setUserFilter('') // Clear requester when organization changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="">All Organizations</option>
              {Array.from(new Set(users.map(u => u.organization).filter((o): o is string => Boolean(o)))).sort().map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.pending.bg, border: `2px solid ${statusColors.pending.border}` }}></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.confirmed.bg, border: `2px solid ${statusColors.confirmed.border}` }}></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.completed.bg, border: `2px solid ${statusColors.completed.border}` }}></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.cancelled.bg, border: `2px solid ${statusColors.cancelled.border}` }}></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow p-4 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        )}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView === 'week' ? 'timeGridWeek' : 'dayGridMonth'}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          nowIndicator={true}
          eventDisplay="block"
          dayMaxEvents={3}
        />
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          editForm={editForm}
          setEditForm={setEditForm}
          onClose={() => { setShowBookingModal(false); setSelectedBooking(null); setError('') }}
          onSubmit={handleUpdateBooking}
          isUpdating={isUpdating}
          error={error}
        />
      )}

      {/* Create Booking Modal */}
      {showCreateModal && (
        <CreateBookingModal
          createForm={createForm}
          setCreateForm={setCreateForm}
          users={users}
          sportsgrounds={sportsgrounds}
          configurations={filteredConfigurations}
          onSportsgroundChange={(id) => {
            setSportsgroundFilter(id)
            setCreateForm(f => ({ ...f, configurationId: '' }))
          }}
          onClose={() => { setShowCreateModal(false); setCreateSlotData(null); setError('') }}
          onSubmit={handleCreateBooking}
          isCreating={isCreating}
          error={error}
        />
      )}
    </div>
  )
}

// Booking Modal Component
function BookingModal({
  booking,
  editForm,
  setEditForm,
  onClose,
  onSubmit,
  isUpdating,
  error
}: {
  booking: CalendarBooking
  editForm: { preferredDate: string; preferredTime: string; status: string; notes: string }
  setEditForm: React.Dispatch<React.SetStateAction<{ preferredDate: string; preferredTime: string; status: string; notes: string }>>
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  isUpdating: boolean
  error: string
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
              <p className="text-sm text-gray-500">{booking.referenceNumber}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Booking Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
            <p><span className="text-gray-500">Requester:</span> <span className="font-medium">{booking.user.fullName}</span></p>
            <p><span className="text-gray-500">Email:</span> {booking.user.email}</p>
            <p><span className="text-gray-500">Configuration:</span> {booking.configuration.name}</p>
            <p><span className="text-gray-500">Sportsground:</span> {booking.configuration.sportsground.name}</p>
            <p><span className="text-gray-500">Sport:</span> {booking.configuration.template.sport}</p>
            <p><span className="text-gray-500">Preferred Time:</span> <span className="font-medium capitalize">{booking.preferredTime}</span></p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={editForm.preferredDate}
                  onChange={(e) => setEditForm({ ...editForm, preferredDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={editForm.preferredTime}
                  onChange={(e) => setEditForm({ ...editForm, preferredTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href={`/dashboard/admin/bookings/${booking.id}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
              >
                View Full Details
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Create Booking Modal Component
function CreateBookingModal({
  createForm,
  setCreateForm,
  users,
  sportsgrounds,
  configurations,
  onSportsgroundChange,
  onClose,
  onSubmit,
  isCreating,
  error
}: {
  createForm: { userId: string; configurationId: string; preferredDate: string; preferredTime: string; notes: string; contactPreference: 'phone' | 'email' }
  setCreateForm: React.Dispatch<React.SetStateAction<{ userId: string; configurationId: string; preferredDate: string; preferredTime: string; notes: string; contactPreference: 'phone' | 'email' }>>
  users: User[]
  sportsgrounds: Sportsground[]
  configurations: Configuration[]
  onSportsgroundChange: (id: string) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  isCreating: boolean
  error: string
}) {
  const [selectedSportsground, setSelectedSportsground] = useState('')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Create Booking</h3>
              <p className="text-sm text-gray-500">Create a booking on behalf of a user</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User *</label>
              <select
                value={createForm.userId}
                onChange={(e) => setCreateForm({ ...createForm, userId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="">Select a user...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sportsground *</label>
              <select
                value={selectedSportsground}
                onChange={(e) => {
                  setSelectedSportsground(e.target.value)
                  onSportsgroundChange(e.target.value)
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="">Select a sportsground...</option>
                {sportsgrounds.map(sg => (
                  <option key={sg.id} value={sg.id}>{sg.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Configuration *</label>
              <select
                value={createForm.configurationId}
                onChange={(e) => setCreateForm({ ...createForm, configurationId: e.target.value })}
                required
                disabled={!selectedSportsground}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:bg-gray-100"
              >
                <option value="">Select a configuration...</option>
                {configurations.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={createForm.preferredDate}
                  onChange={(e) => setCreateForm({ ...createForm, preferredDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <input
                  type="time"
                  value={createForm.preferredTime}
                  onChange={(e) => setCreateForm({ ...createForm, preferredTime: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Preference *</label>
              <select
                value={createForm.contactPreference}
                onChange={(e) => setCreateForm({ ...createForm, contactPreference: e.target.value as 'phone' | 'email' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                rows={3}
                placeholder="Optional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Booking'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
