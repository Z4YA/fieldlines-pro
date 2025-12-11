'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
  createdAt: string
  configuration: {
    id: string
    name: string
    lengthMeters: number
    widthMeters: number
    lineColor: string
    template: {
      name: string
    }
    sportsground: {
      name: string
      address: string
    }
  }
}

export default function BookingConfirmationPage() {
  const params = useParams()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12 max-w-2xl mx-auto">
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking not found</h2>
            <p className="text-gray-500 mb-6">This booking may have been deleted.</p>
            <Link href="/dashboard/bookings">
              <Button>View All Bookings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Request Submitted!</h1>
          <p className="text-gray-600">
            Your line marking service request has been successfully submitted.
          </p>
        </div>

        {/* Booking Reference */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-green-700 mb-1">Booking Reference Number</p>
            <p className="text-2xl font-bold text-green-800">{booking.referenceNumber}</p>
            <p className="text-sm text-green-600 mt-2">
              Please save this reference number for your records
            </p>
          </CardContent>
        </Card>

        {/* Booking Summary */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 py-3 border-b">
                <div>
                  <p className="text-sm text-gray-500">Configuration</p>
                  <p className="text-gray-900 font-medium">{booking.configuration.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Template</p>
                  <p className="text-gray-900">{booking.configuration.template.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-b">
                <div>
                  <p className="text-sm text-gray-500">Dimensions</p>
                  <p className="text-gray-900">
                    {booking.configuration.lengthMeters}m x {booking.configuration.widthMeters}m
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Line Color</p>
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded border border-gray-300 mr-2"
                      style={{ backgroundColor: getColorHex(booking.configuration.lineColor) }}
                    ></div>
                    <span className="text-gray-900 capitalize">{booking.configuration.lineColor}</span>
                  </div>
                </div>
              </div>

              <div className="py-3 border-b">
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-gray-900 font-medium">{booking.configuration.sportsground.name}</p>
                <p className="text-gray-600 text-sm">{booking.configuration.sportsground.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-b">
                <div>
                  <p className="text-sm text-gray-500">Preferred Date</p>
                  <p className="text-gray-900">{formatDate(booking.preferredDate)}</p>
                </div>
                {booking.alternateDate && (
                  <div>
                    <p className="text-sm text-gray-500">Alternate Date</p>
                    <p className="text-gray-900">{formatDate(booking.alternateDate)}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-b">
                <div>
                  <p className="text-sm text-gray-500">Preferred Time</p>
                  <p className="text-gray-900">{formatTime(booking.preferredTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>
              </div>

              <div className="py-3">
                <p className="text-sm text-gray-500">Submitted</p>
                <p className="text-gray-900">
                  {new Date(booking.createdAt).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What Happens Next?</h2>
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  1
                </span>
                <div>
                  <p className="text-gray-900 font-medium">Review</p>
                  <p className="text-gray-600 text-sm">
                    Our team will review your field configuration and booking request
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  2
                </span>
                <div>
                  <p className="text-gray-900 font-medium">Contact</p>
                  <p className="text-gray-600 text-sm">
                    A representative will reach out within 24-48 hours to discuss details
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  3
                </span>
                <div>
                  <p className="text-gray-900 font-medium">Confirmation</p>
                  <p className="text-gray-600 text-sm">
                    We&apos;ll confirm the final date, time, and provide a detailed quote
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  4
                </span>
                <div>
                  <p className="text-gray-900 font-medium">Service</p>
                  <p className="text-gray-600 text-sm">
                    Our professional team will mark your field according to your specifications
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard/bookings" className="flex-1">
            <Button className="w-full">View All Bookings</Button>
          </Link>
          <Link href="/dashboard/configurations" className="flex-1">
            <Button variant="outline" className="w-full">
              Create Another Design
            </Button>
          </Link>
        </div>

        {/* Email Notification */}
        <p className="text-center text-sm text-gray-500 mt-6">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  )
}
