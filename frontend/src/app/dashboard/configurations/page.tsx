'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Configuration {
  id: string
  name: string
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
  }
  template: {
    id: string
    name: string
    sport: string
  }
}

export default function ConfigurationsPage() {
  const [configurations, setConfigurations] = useState<Configuration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')

  const fetchConfigurations = async () => {
    const response = await api.getConfigurations()
    if (response.data) {
      setConfigurations(response.data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchConfigurations()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return
    }

    setDeleteId(id)
    const response = await api.deleteConfiguration(id)
    if (!response.error) {
      setConfigurations((prev) => prev.filter((c) => c.id !== id))
    } else {
      alert(response.error)
    }
    setDeleteId(null)
  }

  const filteredConfigurations = configurations.filter((config) => {
    if (!filter) return true
    const searchLower = filter.toLowerCase()
    return (
      config.name.toLowerCase().includes(searchLower) ||
      config.sportsground.name.toLowerCase().includes(searchLower) ||
      config.template.name.toLowerCase().includes(searchLower)
    )
  })

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Configurations</h1>
          <p className="text-gray-600 mt-1">Manage your saved field designs</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search configurations..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
          />
          <Link href="/dashboard/sportsgrounds">
            <Button>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Design
            </Button>
          </Link>
        </div>
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
      ) : configurations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No configurations yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first field configuration by selecting a sportsground and designing a field.
            </p>
            <Link href="/dashboard/sportsgrounds">
              <Button>Go to Sportsgrounds</Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredConfigurations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matching configurations</h3>
            <p className="text-gray-500">Try a different search term.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConfigurations.map((config) => (
            <Card key={config.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{config.name}</CardTitle>
                    <CardDescription className="truncate">{config.sportsground.name}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Link href={`/dashboard/editor?configuration=${config.id}&sportsground=${config.sportsground.id}`}>
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
                      onClick={() => handleDelete(config.id)}
                      disabled={deleteId === config.id}
                    >
                      {deleteId === config.id ? (
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
                <Link href={`/dashboard/configurations/${config.id}`}>
                  <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group mb-4">
                    {/* Field preview placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center bg-green-800">
                      <div
                        className="border-2 rounded"
                        style={{
                          width: `${Math.min(config.widthMeters, 80)}px`,
                          height: `${Math.min(config.lengthMeters, 100)}px`,
                          borderColor: getColorHex(config.lineColor),
                          transform: `rotate(${config.rotationDegrees}deg)`,
                        }}
                      >
                        <div
                          className="absolute top-1/2 left-0 right-0 border-t"
                          style={{ borderColor: getColorHex(config.lineColor) }}
                        ></div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 font-medium">
                        View Details
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Template:</span>
                    <span className="text-gray-900">{config.template.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dimensions:</span>
                    <span className="text-gray-900">
                      {config.lengthMeters}m x {config.widthMeters}m
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Line Color:</span>
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded border border-gray-300 mr-2"
                        style={{ backgroundColor: getColorHex(config.lineColor) }}
                      ></div>
                      <span className="text-gray-900 capitalize">{config.lineColor}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Rotation:</span>
                    <span className="text-gray-900">{config.rotationDegrees}°</span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <Link href={`/dashboard/configurations/${config.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/configurations/${config.id}/book`} className="flex-1">
                    <Button className="w-full" size="sm">
                      Book Service
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
