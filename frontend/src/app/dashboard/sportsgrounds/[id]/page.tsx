'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleMap } from '@/components/map/google-map'

interface Sportsground {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  defaultZoom: number
  notes?: string
  createdAt: string
  updatedAt: string
  configurations?: Array<{
    id: string
    name: string
    lengthMeters: number
    widthMeters: number
    lineColor: string
    template: {
      name: string
    }
  }>
}

export default function SportsgroundDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [sportsground, setSportsground] = useState<Sportsground | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchSportsground = async () => {
      const response = await api.getSportsground(params.id as string)
      if (response.data) {
        setSportsground(response.data as Sportsground)
      }
      setIsLoading(false)
    }

    if (params.id) {
      fetchSportsground()
    }
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this sportsground? This will also delete all associated configurations.')) {
      return
    }

    setIsDeleting(true)
    const response = await api.deleteSportsground(params.id as string)
    if (!response.error) {
      router.push('/dashboard/sportsgrounds')
    } else {
      alert(response.error)
      setIsDeleting(false)
    }
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

  if (!sportsground) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sportsground not found</h2>
            <p className="text-gray-500 mb-6">This sportsground may have been deleted.</p>
            <Link href="/dashboard/sportsgrounds">
              <Button>Back to Sportsgrounds</Button>
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
          href="/dashboard/sportsgrounds"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sportsgrounds
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{sportsground.name}</h1>
          <p className="text-gray-600 mt-1">{sportsground.address}</p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Link href={`/dashboard/editor?sportsground=${sportsground.id}`}>
            <Button>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                />
              </svg>
              Design Field
            </Button>
          </Link>
          <Link href={`/dashboard/sportsgrounds/${sportsground.id}/edit`}>
            <Button variant="outline">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Map */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Location</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <GoogleMap
              initialCenter={{ lat: sportsground.latitude, lng: sportsground.longitude }}
              initialZoom={sportsground.defaultZoom}
              markerPosition={{ lat: sportsground.latitude, lng: sportsground.longitude }}
              className="h-[400px] rounded-b-lg"
              interactive={true}
              mapType="satellite"
            />
          </CardContent>
        </Card>

        {/* Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-gray-900">{sportsground.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Latitude</p>
                  <p className="text-gray-900">{sportsground.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Longitude</p>
                  <p className="text-gray-900">{sportsground.longitude.toFixed(6)}</p>
                </div>
              </div>
              {sportsground.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-gray-900">{sportsground.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Added</p>
                <p className="text-gray-900">
                  {new Date(sportsground.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configurations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Field Configurations</CardTitle>
                <CardDescription>Saved field designs for this sportsground</CardDescription>
              </div>
              <Link href={`/dashboard/editor?sportsground=${sportsground.id}`}>
                <Button size="sm">New Design</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {sportsground.configurations && sportsground.configurations.length > 0 ? (
                <div className="space-y-3">
                  {sportsground.configurations.map((config) => (
                    <Link
                      key={config.id}
                      href={`/dashboard/configurations/${config.id}`}
                      className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{config.name}</p>
                          <p className="text-sm text-gray-500">{config.template.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">
                            {config.lengthMeters}m x {config.widthMeters}m
                          </p>
                          <div className="flex items-center justify-end mt-1">
                            <div
                              className="w-4 h-4 rounded border mr-1"
                              style={{ backgroundColor: config.lineColor.toLowerCase() }}
                            ></div>
                            <span className="text-sm text-gray-500 capitalize">
                              {config.lineColor}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No configurations yet.</p>
                  <Link href={`/dashboard/editor?sportsground=${sportsground.id}`}>
                    <Button variant="link" className="mt-2">
                      Create your first design
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
