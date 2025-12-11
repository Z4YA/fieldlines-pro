'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
}

export default function SportsgroundsPage() {
  const [sportsgrounds, setSportsgrounds] = useState<Sportsground[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchSportsgrounds = async () => {
    const response = await api.getSportsgrounds()
    if (response.data) {
      setSportsgrounds(response.data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchSportsgrounds()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sportsground? This will also delete all associated configurations.')) {
      return
    }

    setDeleteId(id)
    const response = await api.deleteSportsground(id)
    if (!response.error) {
      setSportsgrounds((prev) => prev.filter((g) => g.id !== id))
    } else {
      alert(response.error)
    }
    setDeleteId(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sportsgrounds</h1>
          <p className="text-gray-600 mt-1">Manage your saved sportsground locations</p>
        </div>
        <Link href="/dashboard/sportsgrounds/new">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Sportsground
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sportsgrounds.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sportsgrounds yet</h3>
            <p className="text-gray-500 mb-6">
              Add your first sportsground to start designing field markings.
            </p>
            <Link href="/dashboard/sportsgrounds/new">
              <Button>Add Your First Sportsground</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sportsgrounds.map((ground) => (
            <Card key={ground.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{ground.name}</CardTitle>
                    <CardDescription className="truncate">{ground.address}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Link href={`/dashboard/sportsgrounds/${ground.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(ground.id)}
                      disabled={deleteId === ground.id}
                    >
                      {deleteId === ground.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Static map preview */}
                <Link href={`/dashboard/sportsgrounds/${ground.id}`}>
                  <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group">
                    <img
                      src={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${ground.longitude},${ground.latitude},${Math.min(ground.defaultZoom, 17)},0/400x200@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`}
                      alt={ground.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 font-medium">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>
                {ground.notes && (
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2">{ground.notes}</p>
                )}
                <div className="mt-3 flex space-x-2">
                  <Link href={`/dashboard/sportsgrounds/${ground.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/editor?sportsground=${ground.id}`} className="flex-1">
                    <Button className="w-full" size="sm">
                      Design Field
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
