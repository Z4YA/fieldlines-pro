'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import mapboxgl from 'mapbox-gl'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface Configuration {
  id: string
  name: string
  latitude: number
  longitude: number
  lengthMeters: number
  widthMeters: number
  lineColor: string
  rotationDegrees: number
  createdAt: string
  updatedAt: string
  sportsground: {
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
    defaultZoom: number
  }
  template: {
    id: string
    name: string
    sport: string
  }
}

export default function ConfigurationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  const [configuration, setConfiguration] = useState<Configuration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

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

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !configuration) return

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [configuration.longitude, configuration.latitude],
      zoom: configuration.sportsground.defaultZoom,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    // Add marker at field center
    new mapboxgl.Marker({ color: '#22c55e' })
      .setLngLat([configuration.longitude, configuration.latitude])
      .addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [configuration])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return
    }

    setIsDeleting(true)
    const response = await api.deleteConfiguration(params.id as string)
    if (!response.error) {
      router.push('/dashboard/configurations')
    } else {
      alert(response.error)
      setIsDeleting(false)
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
          href="/dashboard/configurations"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Configurations
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{configuration.name}</h1>
          <p className="text-gray-600 mt-1">
            {configuration.sportsground.name} - {configuration.template.name}
          </p>
        </div>
        <div className="flex space-x-3 mt-4 md:mt-0">
          <Link href={`/dashboard/configurations/${configuration.id}/book`}>
            <Button>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Book Service
            </Button>
          </Link>
          <Link href={`/dashboard/editor?configuration=${configuration.id}&sportsground=${configuration.sportsground.id}`}>
            <Button variant="outline">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Edit Design
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
        {/* Map Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Field Location</CardTitle>
            <CardDescription>Satellite view of the configured field position</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={mapContainerRef} className="h-[400px] rounded-b-lg" />
          </CardContent>
        </Card>

        {/* Configuration Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Field Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Template</p>
                  <p className="text-gray-900">{configuration.template.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Sport</p>
                  <p className="text-gray-900 capitalize">{configuration.template.sport}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Length (Touchline)</p>
                  <p className="text-gray-900">{configuration.lengthMeters} meters</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Width (Goal Line)</p>
                  <p className="text-gray-900">{configuration.widthMeters} meters</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Rotation</p>
                  <p className="text-gray-900">{configuration.rotationDegrees}°</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Line Color</p>
                  <div className="flex items-center">
                    <div
                      className="w-5 h-5 rounded border border-gray-300 mr-2"
                      style={{ backgroundColor: getColorHex(configuration.lineColor) }}
                    ></div>
                    <span className="text-gray-900 capitalize">{configuration.lineColor}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Latitude</p>
                  <p className="text-gray-900">{configuration.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Longitude</p>
                  <p className="text-gray-900">{configuration.longitude.toFixed(6)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sportsground</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <Link
                  href={`/dashboard/sportsgrounds/${configuration.sportsground.id}`}
                  className="text-green-600 hover:text-green-700"
                >
                  {configuration.sportsground.name}
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-gray-900">{configuration.sportsground.address}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-gray-900">
                  {new Date(configuration.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Modified</p>
                <p className="text-gray-900">
                  {new Date(configuration.updatedAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Field Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Field Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-48 bg-green-800 rounded-lg flex items-center justify-center overflow-hidden">
                <div
                  className="border-2 relative"
                  style={{
                    width: `${Math.min(configuration.widthMeters * 1.5, 150)}px`,
                    height: `${Math.min(configuration.lengthMeters * 1.2, 180)}px`,
                    borderColor: getColorHex(configuration.lineColor),
                    transform: `rotate(${configuration.rotationDegrees}deg)`,
                  }}
                >
                  {/* Center line */}
                  <div
                    className="absolute top-1/2 left-0 right-0 border-t"
                    style={{ borderColor: getColorHex(configuration.lineColor) }}
                  ></div>
                  {/* Center circle */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border"
                    style={{ borderColor: getColorHex(configuration.lineColor) }}
                  ></div>
                  {/* Top penalty area */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-6 border-b border-l border-r"
                    style={{ borderColor: getColorHex(configuration.lineColor) }}
                  ></div>
                  {/* Bottom penalty area */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-6 border-t border-l border-r"
                    style={{ borderColor: getColorHex(configuration.lineColor) }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
