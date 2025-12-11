'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Sportsground {
  id: string
  name: string
  address: string
}

interface Booking {
  id: string
  referenceNumber: string
  status: string
  preferredDate: string
  configuration: {
    sportsground: {
      name: string
    }
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [sportsgrounds, setSportsgrounds] = useState<Sportsground[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [groundsRes, bookingsRes] = await Promise.all([
        api.getSportsgrounds(),
        api.getBookings(),
      ])

      if (groundsRes.data) {
        setSportsgrounds(groundsRes.data.slice(0, 3))
      }
      if (bookingsRes.data) {
        setBookings(bookingsRes.data.filter(b => b.status === 'pending').slice(0, 3))
      }
      setIsLoading(false)
    }

    fetchData()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your sportsgrounds and field line marking bookings.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <CardTitle className="text-lg">Add Sportsground</CardTitle>
            <CardDescription>
              Find and save a new sportsground to your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/sportsgrounds/new">
              <Button className="w-full">Add New Ground</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <CardTitle className="text-lg">Design Field</CardTitle>
            <CardDescription>
              Create a new field configuration with templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/editor">
              <Button variant="outline" className="w-full">Open Editor</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <CardTitle className="text-lg">View Configurations</CardTitle>
            <CardDescription>
              Manage your saved field configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/configurations">
              <Button variant="outline" className="w-full">View All</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Sportsgrounds */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Sportsgrounds</CardTitle>
              <CardDescription>Recently added locations</CardDescription>
            </div>
            <Link href="/dashboard/sportsgrounds">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : sportsgrounds.length > 0 ? (
              <div className="space-y-3">
                {sportsgrounds.map(ground => (
                  <Link
                    key={ground.id}
                    href={`/dashboard/sportsgrounds/${ground.id}`}
                    className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900">{ground.name}</p>
                    <p className="text-sm text-gray-500 truncate">{ground.address}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No sportsgrounds added yet.</p>
                <Link href="/dashboard/sportsgrounds/new">
                  <Button variant="link" className="mt-2">Add your first ground</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Bookings</CardTitle>
              <CardDescription>Awaiting confirmation</CardDescription>
            </div>
            <Link href="/dashboard/bookings">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                ))}
              </div>
            ) : bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map(booking => (
                  <Link
                    key={booking.id}
                    href={`/dashboard/bookings/${booking.id}`}
                    className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{booking.referenceNumber}</p>
                        <p className="text-sm text-gray-500">{booking.configuration.sportsground.name}</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(booking.preferredDate).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No pending bookings.</p>
                <Link href="/dashboard/configurations">
                  <Button variant="link" className="mt-2">Book a service</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
