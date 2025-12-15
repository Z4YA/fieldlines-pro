'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Home() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isAuthLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(formData.email, formData.password)

    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Login failed. Please try again.')
    }

    setIsLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section with Login */}
      <section className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side - Hero Content */}
        <div className="relative flex-1 bg-gradient-to-br from-green-600 to-green-800 text-white p-8 lg:p-16 flex flex-col justify-center">
          {/* Logo */}
          <div className="absolute top-6 left-6 lg:top-8 lg:left-8">
            <span className="text-2xl font-bold">XACTLINE</span>
          </div>

          <div className="mt-16 lg:mt-0 max-w-xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Professional Sports Field Line Marking Made Simple
            </h1>
            <p className="text-lg md:text-xl text-green-100 mb-8">
              Design, visualize, and book line marking services for your sportsgrounds with precision and ease.
            </p>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-green-100">Satellite imagery field visualization</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-green-100">Regulation-compliant field templates</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-green-100">Easy online booking system</span>
              </div>
            </div>

            {/* Mobile: Show link to scroll to login */}
            <div className="lg:hidden">
              <a
                href="#login-section"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-green-700 font-semibold rounded-lg hover:bg-green-50 transition-colors"
              >
                Sign In to Get Started
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Decorative field lines */}
          <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
              <rect x="100" y="50" width="600" height="400" fill="none" stroke="white" strokeWidth="4"/>
              <line x1="400" y1="50" x2="400" y2="450" stroke="white" strokeWidth="4"/>
              <circle cx="400" cy="250" r="60" fill="none" stroke="white" strokeWidth="4"/>
              <rect x="100" y="150" width="80" height="200" fill="none" stroke="white" strokeWidth="4"/>
              <rect x="620" y="150" width="80" height="200" fill="none" stroke="white" strokeWidth="4"/>
            </svg>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div
          id="login-section"
          className="w-full lg:w-[480px] bg-white p-8 lg:p-12 flex flex-col justify-center"
        >
          <div className="max-w-sm mx-auto w-full">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <span className="text-2xl font-bold text-green-600">XACTLINE</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600 mb-8">
              Sign in to access your dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

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
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-green-600 hover:text-green-500"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">New to XACTLINE?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/register"
                  className="w-full flex items-center justify-center px-4 py-3 border-2 border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            How XACTLINE Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold text-lg">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Find Your Field</h3>
              <p className="text-gray-600 text-sm">
                Search for your sportsground and view high-resolution satellite imagery.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold text-lg">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Design Your Lines</h3>
              <p className="text-gray-600 text-sm">
                Position and customize regulation-compliant field templates.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold text-lg">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Book Service</h3>
              <p className="text-gray-600 text-sm">
                Submit your booking and receive confirmation within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-white font-bold text-xl">XACTLINE</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-white transition-colors">Register</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm">
            &copy; {new Date().getFullYear()} XACTLINE. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}
