'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Configuration {
  id: string
  name: string
  lengthMeters: number
  widthMeters: number
  lineColor: string
  rotationDegrees: number
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
}

const TIME_PREFERENCES = [
  { value: 'morning', label: 'Morning (6am - 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm - 6pm)' },
  { value: 'evening', label: 'Evening (6pm - 9pm)' },
  { value: 'flexible', label: 'Flexible / Any Time' },
]

const CONTACT_PREFERENCES = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'both', label: 'Either email or phone' },
]

export default function BookConfigurationPage() {
  const params = useParams()
  const router = useRouter()
  const [configuration, setConfiguration] = useState<Configuration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    preferredDate: '',
    alternateDate: '',
    preferredTime: 'flexible',
    contactPreference: 'email',
    notes: '',
    acceptTerms: false,
  })

  useEffect(() => {
    const fetchConfiguration = async () => {
      const response = await api.getConfiguration(params.id as string)
      if (response.data) {
        setConfiguration(response.data as Configuration)
      }
      setIsLoading(false)
    }

    if (params.id) {
      fetchConfiguration()
    }
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.preferredDate) {
      setError('Please select a preferred date')
      return
    }

    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions')
      return
    }

    setIsSubmitting(true)

    const response = await api.createBooking({
      configurationId: params.id as string,
      preferredDate: new Date(formData.preferredDate).toISOString(),
      alternativeDate: formData.alternateDate ? new Date(formData.alternateDate).toISOString() : undefined,
      preferredTime: formData.preferredTime,
      contactPreference: formData.contactPreference as 'phone' | 'email',
      notes: formData.notes || undefined,
    })

    if (response.error) {
      setError(response.error)
      setIsSubmitting(false)
    } else {
      const booking = response.data as { id: string }
      router.push(`/dashboard/bookings/${booking.id}/confirmation`)
    }
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

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
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

  if (!configuration) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration not found</h2>
            <p className="text-gray-500 mb-6">This configuration may have been deleted.</p>
            <Link href="/dashboard/configurations">
              <Button>Back to Configurations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/dashboard/configurations/${configuration.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Configuration
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Book Line Marking Service</h1>
        <p className="text-gray-600 mt-1">Request a professional line marking service for your field configuration</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Fill in your preferred dates and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="preferredDate">Preferred Date *</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  min={getMinDate()}
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">Select your first choice date for the service</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternateDate">Alternate Date (optional)</Label>
                <Input
                  id="alternateDate"
                  type="date"
                  min={getMinDate()}
                  value={formData.alternateDate}
                  onChange={(e) => setFormData({ ...formData, alternateDate: e.target.value })}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">Provide a backup date if your first choice is unavailable</p>
              </div>

              <div className="space-y-2">
                <Label>Preferred Time</Label>
                <div className="space-y-2">
                  {TIME_PREFERENCES.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="preferredTime"
                        value={option.value}
                        checked={formData.preferredTime === option.value}
                        onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                        disabled={isSubmitting}
                        className="mr-2 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contact Preference</Label>
                <div className="space-y-2">
                  {CONTACT_PREFERENCES.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="contactPreference"
                        value={option.value}
                        checked={formData.contactPreference === option.value}
                        onChange={(e) => setFormData({ ...formData, contactPreference: e.target.value })}
                        disabled={isSubmitting}
                        className="mr-2 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Special Instructions / Notes (optional)</Label>
                <textarea
                  id="notes"
                  rows={4}
                  placeholder="Any special requirements, access instructions, or other notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value.slice(0, 500) })}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500">{formData.notes.length}/500 characters</p>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    disabled={isSubmitting}
                    className="mt-1 mr-3 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{' '}
                    <a href="#" className="text-green-600 hover:text-green-700 underline">
                      terms and conditions
                    </a>{' '}
                    and understand that this is a booking request. A representative will contact me to confirm the
                    appointment and provide pricing.
                  </span>
                </label>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                </Button>
                <Link href={`/dashboard/configurations/${configuration.id}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full" disabled={isSubmitting}>
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Configuration Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Configuration Name</p>
                <p className="text-gray-900 font-semibold">{configuration.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Template</p>
                <p className="text-gray-900">{configuration.template.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Dimensions</p>
                  <p className="text-gray-900">
                    {configuration.lengthMeters}m x {configuration.widthMeters}m
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Line Color</p>
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded border border-gray-300 mr-2"
                      style={{ backgroundColor: getColorHex(configuration.lineColor) }}
                    ></div>
                    <span className="text-gray-900 capitalize">{configuration.lineColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Rotation</p>
                <p className="text-gray-900">{configuration.rotationDegrees}°</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Sportsground</p>
                <p className="text-gray-900">{configuration.sportsground.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-gray-900">{configuration.sportsground.address}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-green-800">What happens next?</p>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>1. Your booking request will be sent to our team</li>
                    <li>2. We&apos;ll review your field configuration</li>
                    <li>3. A representative will contact you within 24-48 hours</li>
                    <li>4. We&apos;ll confirm the date, time, and provide a quote</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
