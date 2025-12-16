'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleMap } from '@/components/map/google-map'
import { LocationSearch } from '@/components/map/location-search'

interface User {
  id: string
  fullName: string
  email: string
}

export default function AdminNewSportsgroundPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: -33.8688, lng: 151.2093 }) // Sydney default
  const [mapZoom, setMapZoom] = useState(15)

  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    notes: '',
  })

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await api.getAdminUsersSimple()
      if (response.data) {
        setUsers(response.data.users)
      }
      setIsLoadingUsers(false)
    }
    fetchUsers()
  }, [])

  const handleLocationSelect = (result: {
    placeName: string
    center: [number, number]
    address: string
  }) => {
    setFormData((prev) => ({
      ...prev,
      // Auto-populate name from Google place name if not already set
      name: prev.name || result.placeName,
      address: result.address,
      longitude: result.center[0],
      latitude: result.center[1],
    }))
    const newPosition = { lat: result.center[1], lng: result.center[0] }
    setMarkerPosition(newPosition)
    setMapCenter(newPosition)
    setMapZoom(17) // Zoom in to see the field clearly
  }

  const handleMapClick = (latLng: { lat: number; lng: number }) => {
    setFormData((prev) => ({
      ...prev,
      longitude: latLng.lng,
      latitude: latLng.lat,
    }))
    setMarkerPosition(latLng)
  }

  const handleMapMove = (center: { lat: number; lng: number }, zoom: number) => {
    setMapZoom(zoom)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.userId) {
      setError('Please select a user to assign this sportsground to')
      return
    }

    if (!formData.name.trim()) {
      setError('Please enter a name for this sportsground')
      return
    }

    if (!formData.address.trim()) {
      setError('Please search for and select a location')
      return
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Please select a location on the map')
      return
    }

    setIsLoading(true)

    const response = await api.createAdminSportsground({
      userId: formData.userId,
      name: formData.name,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      defaultZoom: Math.round(mapZoom),
      notes: formData.notes || undefined,
    })

    if (response.error) {
      setError(response.error)
      setIsLoading(false)
    } else {
      router.push('/dashboard/admin/sportsgrounds')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/admin/sportsgrounds"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sportsgrounds
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New Sportsground</CardTitle>
              <CardDescription>
                Create a sportsground and assign it to a user on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                {/* User Selection */}
                <div className="space-y-2">
                  <Label htmlFor="user">Assign to User *</Label>
                  {isLoadingUsers ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                      Loading users...
                    </div>
                  ) : (
                    <select
                      id="user"
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      disabled={isLoading}
                    >
                      <option value="">Select a user...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName} ({user.email})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-sm text-gray-500">
                    The selected user will own this sportsground and be able to create field configurations on it.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search">Search Location</Label>
                  <LocationSearch
                    onSelect={handleLocationSelect}
                    placeholder="Search by address, suburb, or place name..."
                  />
                  <p className="text-sm text-gray-500">
                    Search for an address or click on the map to set the location
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Sportsground Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Central Park Soccer Field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={isLoading}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="text"
                      value={formData.latitude ? formData.latitude.toFixed(6) : ''}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="text"
                      value={formData.longitude ? formData.longitude.toFixed(6) : ''}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Any additional notes about this sportsground..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" disabled={isLoading} className="flex-1 bg-orange-600 hover:bg-orange-700">
                    {isLoading ? 'Creating...' : 'Create Sportsground'}
                  </Button>
                  <Link href="/dashboard/admin/sportsgrounds" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:sticky lg:top-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Location</CardTitle>
              <CardDescription>
                Click on the map to set the exact location of the sportsground
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <GoogleMap
                initialCenter={mapCenter}
                initialZoom={mapZoom}
                center={mapCenter}
                zoom={mapZoom}
                onMapClick={handleMapClick}
                onMapMove={handleMapMove}
                markerPosition={markerPosition}
                className="h-[500px] rounded-b-lg"
                mapType="satellite"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
