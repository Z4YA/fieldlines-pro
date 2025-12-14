'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useBookingCart, SelectedConfiguration } from '@/lib/booking-cart-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Step = 'review' | 'scheduling' | 'contact' | 'confirmation'

interface BookingResult {
  bookingGroup: {
    id: string
    groupReferenceNumber: string
    status: string
    createdAt: string
  }
  bookings: Array<{
    id: string
    referenceNumber: string
    configurationId: string
    configurationName: string
    preferredDate: string
    preferredTime: string
  }>
}

export default function MultiBookingPage() {
  const router = useRouter()
  const {
    selectedConfigurations,
    sportsgroundId,
    sportsgroundName,
    clearCart,
    updateConfigurationDate,
    setUseCustomDate,
  } = useBookingCart()

  const [currentStep, setCurrentStep] = useState<Step>('review')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)

  // Form state
  const [defaultPreferredDate, setDefaultPreferredDate] = useState('')
  const [defaultPreferredTime, setDefaultPreferredTime] = useState('flexible')
  const [alternativeDate, setAlternativeDate] = useState('')
  const [contactPreference, setContactPreference] = useState<'email' | 'phone' | 'both'>('email')
  const [notes, setNotes] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Redirect if cart is empty
  useEffect(() => {
    if (selectedConfigurations.length === 0 && currentStep !== 'confirmation') {
      router.push('/dashboard/configurations')
    }
  }, [selectedConfigurations, currentStep, router])

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

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const handleSubmit = async () => {
    if (!sportsgroundId) return

    setIsSubmitting(true)
    setError(null)

    try {
      const configurations = selectedConfigurations.map(config => ({
        configurationId: config.id,
        preferredDate: config.useCustomDate && config.customDate ? config.customDate : undefined,
        preferredTime: config.useCustomDate && config.customTime ? config.customTime : undefined,
      }))

      const response = await api.createBatchBooking({
        sportsgroundId,
        configurations,
        defaultPreferredDate,
        defaultPreferredTime,
        alternativeDate: alternativeDate || undefined,
        notes: notes || undefined,
        contactPreference,
      })

      if (response.error || !response.data) {
        setError(response.error || 'Failed to create booking')
        setIsSubmitting(false)
        return
      }

      setBookingResult(response.data)
      clearCart()
      setCurrentStep('confirmation')
    } catch (err) {
      setError('Failed to create booking. Please try again.')
    }
    setIsSubmitting(false)
  }

  const renderStepIndicator = () => {
    const steps = [
      { id: 'review', label: 'Review' },
      { id: 'scheduling', label: 'Schedule' },
      { id: 'contact', label: 'Contact' },
      { id: 'confirmation', label: 'Confirm' },
    ]

    const currentIndex = steps.findIndex(s => s.id === currentStep)

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index < currentIndex
                  ? 'bg-green-600 text-white'
                  : index === currentIndex
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index < currentIndex ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`ml-2 text-sm ${
                index <= currentIndex ? 'text-gray-900 font-medium' : 'text-gray-500'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-3 ${
                  index < currentIndex ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderReviewStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Selected Configurations</CardTitle>
          <p className="text-sm text-gray-500">
            Review the field configurations you want to book
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-medium">Sportsground:</span> {sportsgroundName}
            </p>
          </div>

          <div className="space-y-3">
            {selectedConfigurations.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{config.name}</p>
                  <p className="text-sm text-gray-500">{config.templateName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {config.lengthMeters}m x {config.widthMeters}m
                    </span>
                    <div className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded border border-gray-300"
                        style={{ backgroundColor: getColorHex(config.lineColor) }}
                      />
                      <span className="text-xs text-gray-500 capitalize">{config.lineColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Link href="/dashboard/configurations">
          <Button variant="outline">Back to Configurations</Button>
        </Link>
        <Button onClick={() => setCurrentStep('scheduling')}>
          Continue to Scheduling
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  )

  const renderSchedulingStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default Schedule</CardTitle>
          <p className="text-sm text-gray-500">
            Set the default date and time for all configurations
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={defaultPreferredDate}
              onChange={(e) => setDefaultPreferredDate(e.target.value)}
              min={getTomorrowDate()}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Time
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'morning', label: 'Morning (6am-12pm)' },
                { value: 'afternoon', label: 'Afternoon (12pm-6pm)' },
                { value: 'evening', label: 'Evening (6pm-9pm)' },
                { value: 'flexible', label: 'Flexible' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    defaultPreferredTime === option.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="preferredTime"
                    value={option.value}
                    checked={defaultPreferredTime === option.value}
                    onChange={(e) => setDefaultPreferredTime(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per-Configuration Dates (Optional)</CardTitle>
          <p className="text-sm text-gray-500">
            Customize dates for individual configurations if needed
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedConfigurations.map((config) => (
              <div
                key={config.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{config.name}</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.useCustomDate}
                      onChange={(e) => setUseCustomDate(config.id, e.target.checked)}
                      className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-600">Use custom date</span>
                  </label>
                </div>

                {config.useCustomDate && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Date</label>
                      <input
                        type="date"
                        value={config.customDate || ''}
                        onChange={(e) => updateConfigurationDate(config.id, e.target.value, config.customTime || defaultPreferredTime)}
                        min={getTomorrowDate()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Time</label>
                      <select
                        value={config.customTime || defaultPreferredTime}
                        onChange={(e) => updateConfigurationDate(config.id, config.customDate || '', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('review')}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <Button
          onClick={() => setCurrentStep('contact')}
          disabled={!defaultPreferredDate}
        >
          Continue to Contact
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  )

  const renderContactStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact & Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alternative Date (Optional)
            </label>
            <input
              type="date"
              value={alternativeDate}
              onChange={(e) => setAlternativeDate(e.target.value)}
              min={getTomorrowDate()}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide a backup date in case the preferred date is unavailable
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Preference
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'email', label: 'Email' },
                { value: 'phone', label: 'Phone' },
                { value: 'both', label: 'Either' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    contactPreference === option.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="contactPreference"
                    value={option.value}
                    checked={contactPreference === option.value}
                    onChange={(e) => setContactPreference(e.target.value as 'email' | 'phone' | 'both')}
                    className="sr-only"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Instructions / Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Any special requirements, access instructions, or other notes..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{notes.length}/500</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-0.5"
              />
              <span className="text-sm text-gray-600">
                I agree to the{' '}
                <Link href="/terms" className="text-green-600 hover:underline">
                  terms and conditions
                </Link>{' '}
                and understand that this is a booking request subject to confirmation.
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('scheduling')}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!termsAccepted || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            <>
              Submit Booking Request
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderConfirmationStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Booking Request Submitted!</h2>
        <p className="text-gray-600 mt-2">
          Your booking request has been received and is pending confirmation.
        </p>
      </div>

      {bookingResult && (
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Group Reference Number</p>
              <p className="text-2xl font-bold text-green-600">
                {bookingResult.bookingGroup.groupReferenceNumber}
              </p>
            </div>

            <div className="text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Individual Booking References:
              </p>
              <div className="space-y-2">
                {bookingResult.bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-900">{booking.configurationName}</span>
                    <span className="text-sm font-mono text-green-600">{booking.referenceNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium text-gray-900 mb-4">What Happens Next?</h3>
          <div className="text-left space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-medium text-green-600">1</span>
              </div>
              <p className="text-sm text-gray-600">
                You&apos;ll receive a confirmation email with your booking details
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-medium text-green-600">2</span>
              </div>
              <p className="text-sm text-gray-600">
                Our team will review your request and confirm availability
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-medium text-green-600">3</span>
              </div>
              <p className="text-sm text-gray-600">
                We&apos;ll contact you to confirm the booking and schedule
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-medium text-green-600">4</span>
              </div>
              <p className="text-sm text-gray-600">
                Our team will arrive on the scheduled day to mark your fields
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Link href="/dashboard/bookings">
          <Button variant="outline">View All Bookings</Button>
        </Link>
        <Link href="/dashboard/configurations">
          <Button>Book More Fields</Button>
        </Link>
      </div>
    </div>
  )

  if (selectedConfigurations.length === 0 && currentStep !== 'confirmation') {
    return null // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/configurations"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Configurations
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Book Multiple Fields
      </h1>
      <p className="text-gray-600 mb-8">
        {currentStep === 'confirmation'
          ? 'Your booking request has been submitted'
          : `Complete the steps below to book ${selectedConfigurations.length} field${selectedConfigurations.length > 1 ? 's' : ''}`}
      </p>

      {renderStepIndicator()}

      {currentStep === 'review' && renderReviewStep()}
      {currentStep === 'scheduling' && renderSchedulingStep()}
      {currentStep === 'contact' && renderContactStep()}
      {currentStep === 'confirmation' && renderConfirmationStep()}
    </div>
  )
}
