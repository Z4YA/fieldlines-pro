'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Booking {
  id: string
  referenceNumber: string
  preferredDate: string
  alternateDate?: string
  preferredTime: string
  contactPreference: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  configuration: {
    id: string
    name: string
    latitude: number
    longitude: number
    lengthMeters: number
    widthMeters: number
    lineColor: string
    rotationDegrees: number
    template: {
      name: string
      sport: string
    }
    sportsground: {
      id: string
      name: string
      address: string
      defaultZoom: number
    }
  }
}

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  confirmed: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  completed: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
}

// Load Google Maps script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve()
      return
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps script'))
    document.head.appendChild(script)
  })
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)

  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  useEffect(() => {
    const fetchBooking = async () => {
      const response = await api.getBooking(params.id as string)
      if (response.data) {
        setBooking(response.data as Booking)
      }
      setIsLoading(false)
    }

    if (params.id) {
      fetchBooking()
    }
  }, [params.id])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !booking || !GOOGLE_API_KEY) return

    loadGoogleMapsScript(GOOGLE_API_KEY)
      .then(() => {
        if (!mapContainerRef.current || mapRef.current) return

        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: booking.configuration.latitude, lng: booking.configuration.longitude },
          zoom: booking.configuration.sportsground.defaultZoom,
          mapTypeId: 'satellite',
          tilt: 0,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        })

        new google.maps.Marker({
          position: { lat: booking.configuration.latitude, lng: booking.configuration.longitude },
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#22c55e',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        })

        mapRef.current = map
      })
      .catch(console.error)

    return () => {
      mapRef.current = null
    }
  }, [booking, GOOGLE_API_KEY])

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking? Please note cancellations within 48 hours of the scheduled service may incur fees.')) {
      return
    }

    setIsCancelling(true)
    const response = await api.cancelBooking(params.id as string)
    if (!response.error) {
      setBooking((prev) => (prev ? { ...prev, status: 'cancelled' } : null))
    } else {
      alert(response.error)
    }
    setIsCancelling(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    const timeMap: Record<string, string> = {
      morning: 'Morning (6am - 12pm)',
      afternoon: 'Afternoon (12pm - 6pm)',
      evening: 'Evening (6pm - 9pm)',
      flexible: 'Flexible / Any Time',
    }
    return timeMap[time] || time
  }

  const formatContactPreference = (pref: string) => {
    const prefMap: Record<string, string> = {
      email: 'Email',
      phone: 'Phone',
      both: 'Either email or phone',
    }
    return prefMap[pref] || pref
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking not found</h2>
            <p className="text-gray-500 mb-6">This booking may have been deleted.</p>
            <Link href="/dashboard/bookings">
              <Button>Back to Bookings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.pending

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/bookings"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Bookings
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{booking.referenceNumber}</h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}
            >
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
          </div>
          <p className="text-gray-600">
            {booking.configuration.name} at {booking.configuration.sportsground.name}
          </p>
        </div>
        <div className="flex space-x-3">
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          )}
          <Link href={`/dashboard/configurations/${booking.configuration.id}`}>
            <Button variant="outline">View Configuration</Button>
          </Link>
        </div>
      </div>

      {/* Status Banner */}
      {booking.status === 'pending' && (
        <Card className={`mb-6 ${statusStyle.bg} ${statusStyle.border} border`}>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <svg className={`w-6 h-6 ${statusStyle.text} mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className={`font-medium ${statusStyle.text}`}>Awaiting Confirmation</p>
                <p className="text-sm text-gray-600">
                  Your booking request is being reviewed. A representative will contact you within 24-48 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {booking.status === 'confirmed' && (
        <Card className={`mb-6 ${statusStyle.bg} ${statusStyle.border} border`}>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <svg className={`w-6 h-6 ${statusStyle.text} mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className={`font-medium ${statusStyle.text}`}>Booking Confirmed</p>
                <p className="text-sm text-gray-600">
                  Your service has been scheduled. Our team will arrive on the confirmed date.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Map */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Field Location</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={mapContainerRef} className="h-[400px] rounded-b-lg" />
          </CardContent>
        </Card>

        {/* Details */}
        <div className="space-y-6">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Reference Number</p>
                  <p className="text-gray-900 font-mono">{booking.referenceNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Preferred Date</p>
                  <p className="text-gray-900">{formatDate(booking.preferredDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Preferred Time</p>
                  <p className="text-gray-900">{formatTime(booking.preferredTime)}</p>
                </div>
              </div>

              {booking.alternateDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Alternate Date</p>
                  <p className="text-gray-900">{formatDate(booking.alternateDate)}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500">Contact Preference</p>
                <p className="text-gray-900">{formatContactPreference(booking.contactPreference)}</p>
              </div>

              {booking.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes / Special Instructions</p>
                  <p className="text-gray-900">{booking.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Submitted</p>
                  <p className="text-gray-900 text-sm">
                    {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="text-gray-900 text-sm">
                    {new Date(booking.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Field Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Configuration Name</p>
                <Link
                  href={`/dashboard/configurations/${booking.configuration.id}`}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  {booking.configuration.name}
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Template</p>
                  <p className="text-gray-900">{booking.configuration.template.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Sport</p>
                  <p className="text-gray-900 capitalize">{booking.configuration.template.sport}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Dimensions</p>
                  <p className="text-gray-900">
                    {booking.configuration.lengthMeters}m x {booking.configuration.widthMeters}m
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Line Color</p>
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
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Rotation</p>
                <p className="text-gray-900">{booking.configuration.rotationDegrees}°</p>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Sportsground</p>
                <Link
                  href={`/dashboard/sportsgrounds/${booking.configuration.sportsground.id}`}
                  className="text-green-600 hover:text-green-700"
                >
                  {booking.configuration.sportsground.name}
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-gray-900">{booking.configuration.sportsground.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Latitude</p>
                  <p className="text-gray-900">{booking.configuration.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Longitude</p>
                  <p className="text-gray-900">{booking.configuration.longitude.toFixed(6)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
