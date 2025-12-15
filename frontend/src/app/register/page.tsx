'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Invitation state
  const [invitationToken, setInvitationToken] = useState<string | null>(null)
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null)
  const [invitedBy, setInvitedBy] = useState<string | null>(null)
  const [isValidatingInvitation, setIsValidatingInvitation] = useState(false)
  const [invitationError, setInvitationError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })

  // Check for invitation token on mount
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      setInvitationToken(token)
      validateInvitation(token)
    }
  }, [searchParams])

  const validateInvitation = async (token: string) => {
    setIsValidatingInvitation(true)
    setInvitationError(null)

    const response = await api.validateUserInvitation(token)

    if (response.error) {
      setInvitationError(response.error)
      setInvitationToken(null)
    } else if (response.data) {
      setInvitationEmail(response.data.email)
      setInvitedBy(response.data.invitedBy)
      setFormData(prev => ({ ...prev, email: response.data!.email }))
    }

    setIsValidatingInvitation(false)
  }

  const validateForm = () => {
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (!formData.acceptTerms) {
      setError('You must accept the terms and conditions')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setIsLoading(true)

    // If registering with invitation token
    if (invitationToken && invitationEmail) {
      const response = await api.registerWithInvitation({
        token: invitationToken,
        fullName: formData.fullName,
        phone: formData.phone,
        password: formData.password,
        organization: formData.organization || undefined,
      })

      if (response.error) {
        setError(response.error)
      } else {
        setSuccess(true)
      }
    } else {
      // Regular registration
      const result = await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        organization: formData.organization || undefined,
      })

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Registration failed. Please try again.')
      }
    }

    setIsLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Loading state for invitation validation
  if (isValidatingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Validating your invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid invitation error
  if (invitationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center text-red-600">
              {invitationError}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center text-gray-600">
            <p>
              The invitation link you used is invalid, expired, or has already been used.
            </p>
            <p className="text-sm">
              Please contact the administrator who sent you the invitation to request a new one.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/register')}
            >
              Register without invitation
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              {invitationToken ? 'Registration Complete!' : 'Check your email'}
            </CardTitle>
            <CardDescription className="text-center">
              {invitationToken ? (
                'Your account has been created successfully. You can now log in.'
              ) : (
                <>We&apos;ve sent a verification link to <strong>{formData.email}</strong></>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center text-gray-600">
            {invitationToken ? (
              <p>
                Welcome to XACTLINE! You can now log in and start using the platform.
              </p>
            ) : (
              <>
                <p>
                  Click the link in the email to verify your account and get started with XACTLINE.
                </p>
                <p className="text-sm">
                  Didn&apos;t receive the email? Check your spam folder or{' '}
                  <button className="text-green-600 hover:text-green-500 font-medium">
                    click here to resend
                  </button>
                </p>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Link href="/" className="text-2xl font-bold text-green-600">
              XACTLINE
            </Link>
          </div>
          <CardTitle className="text-2xl text-center">
            {invitationToken ? 'Complete Your Registration' : 'Create your account'}
          </CardTitle>
          <CardDescription className="text-center">
            {invitationToken && invitedBy ? (
              <>
                <span className="font-medium text-green-600">{invitedBy}</span> has invited you to join XACTLINE
              </>
            ) : (
              'Get started with professional field line marking'
            )}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {invitationToken && invitationEmail && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  You are registering with the email: <strong>{invitationEmail}</strong>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                placeholder="John Smith"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {!invitationToken && (
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                placeholder="+61 400 000 000"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization (optional)</Label>
              <Input
                id="organization"
                name="organization"
                type="text"
                autoComplete="organization"
                placeholder="Club or organization name"
                value={formData.organization}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-start space-x-2">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="h-4 w-4 mt-1 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <Label htmlFor="acceptTerms" className="text-sm text-gray-600 font-normal">
                I agree to the{' '}
                <Link href="/terms" className="text-green-600 hover:text-green-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-green-600 hover:text-green-500">
                  Privacy Policy
                </Link>
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : (invitationToken ? 'Complete Registration' : 'Create account')}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-green-600 hover:text-green-500 font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}
