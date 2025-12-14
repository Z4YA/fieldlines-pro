'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useBookingCart } from '@/lib/booking-cart-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FloatingCart } from '@/components/booking/floating-cart'

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

type SortField = 'name' | 'sportsground' | 'template' | 'dimensions' | 'lineColor' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export default function ConfigurationsPage() {
  const [configurations, setConfigurations] = useState<Configuration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [sportsgroundFilter, setSportsgroundFilter] = useState<string>('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const {
    addConfiguration,
    removeConfiguration,
    isSelected,
    canAddConfiguration,
    sportsgroundName: cartSportsgroundName,
    totalCount: cartCount,
  } = useBookingCart()

  const handleToggleSelection = (config: Configuration) => {
    if (isSelected(config.id)) {
      removeConfiguration(config.id)
    } else {
      addConfiguration({
        id: config.id,
        name: config.name,
        sportsgroundId: config.sportsground.id,
        sportsgroundName: config.sportsground.name,
        templateName: config.template.name,
        lengthMeters: config.lengthMeters,
        widthMeters: config.widthMeters,
        lineColor: config.lineColor,
      })
    }
  }

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

  // Get unique sportsgrounds for filter dropdown
  const sportsgrounds = useMemo(() => {
    const uniqueSportsgrounds = new Map<string, { id: string; name: string }>()
    configurations.forEach((config) => {
      if (!uniqueSportsgrounds.has(config.sportsground.id)) {
        uniqueSportsgrounds.set(config.sportsground.id, {
          id: config.sportsground.id,
          name: config.sportsground.name,
        })
      }
    })
    return Array.from(uniqueSportsgrounds.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [configurations])

  // Filter and sort configurations
  const filteredAndSortedConfigurations = useMemo(() => {
    const filtered = configurations.filter((config) => {
      // Search filter
      if (searchFilter) {
        const searchLower = searchFilter.toLowerCase()
        const matchesSearch =
          config.name.toLowerCase().includes(searchLower) ||
          config.sportsground.name.toLowerCase().includes(searchLower) ||
          config.template.name.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Sportsground filter
      if (sportsgroundFilter && config.sportsground.id !== sportsgroundFilter) {
        return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'sportsground':
          comparison = a.sportsground.name.localeCompare(b.sportsground.name)
          break
        case 'template':
          comparison = a.template.name.localeCompare(b.template.name)
          break
        case 'dimensions':
          comparison = (a.lengthMeters * a.widthMeters) - (b.lengthMeters * b.widthMeters)
          break
        case 'lineColor':
          comparison = a.lineColor.localeCompare(b.lineColor)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [configurations, searchFilter, sportsgroundFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Configurations</h1>
          <p className="text-gray-600 mt-1">Manage your saved field designs</p>
        </div>
        <Link href="/dashboard/sportsgrounds">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Design
          </Button>
        </Link>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search configurations..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 sm:max-w-xs"
          />
          <select
            value={sportsgroundFilter}
            onChange={(e) => setSportsgroundFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">All Sportsgrounds</option>
            {sportsgrounds.map((sg) => (
              <option key={sg.id} value={sg.id}>
                {sg.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-2 flex items-center gap-1 ${
              viewMode === 'cards' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Card View"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 flex items-center gap-1 ${
              viewMode === 'table' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Table View"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cart selection banner */}
      {cartCount > 0 && cartSportsgroundName && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-800">
            <span className="font-medium">Selecting from: {cartSportsgroundName}</span>
            <span className="text-green-600 ml-1">— Only configurations from this sportsground can be added to your booking.</span>
          </p>
        </div>
      )}

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
      ) : filteredAndSortedConfigurations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matching configurations</h3>
            <p className="text-gray-500">Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-12">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                    >
                      Name
                      <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('sportsground')}
                      className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                    >
                      Sportsground
                      <SortIcon field="sportsground" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('template')}
                      className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                    >
                      Template
                      <SortIcon field="template" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('dimensions')}
                      className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                    >
                      Dimensions
                      <SortIcon field="dimensions" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('lineColor')}
                      className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                    >
                      Color
                      <SortIcon field="lineColor" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                    >
                      Created
                      <SortIcon field="createdAt" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedConfigurations.map((config) => {
                  const selected = isSelected(config.id)
                  const canAdd = canAddConfiguration(config.sportsground.id)
                  return (
                  <tr key={config.id} className={`hover:bg-gray-50 ${selected ? 'bg-green-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={!canAdd && !selected}
                          onChange={() => handleToggleSelection(config)}
                          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          title={!canAdd && !selected ? `Only configurations from ${cartSportsgroundName} can be selected` : undefined}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/configurations/${config.id}`}
                        className="font-medium text-gray-900 hover:text-green-600"
                      >
                        {config.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{config.sportsground.name}</td>
                    <td className="px-4 py-3 text-gray-600">{config.template.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {config.lengthMeters}m x {config.widthMeters}m
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: getColorHex(config.lineColor) }}
                        />
                        <span className="text-gray-600 capitalize">{config.lineColor}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(config.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/configurations/${config.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/dashboard/editor?configuration=${config.id}&sportsground=${config.sportsground.id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(config.id)}
                          disabled={deleteId === config.id}
                        >
                          {deleteId === config.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedConfigurations.map((config) => {
            const selected = isSelected(config.id)
            const canAdd = canAddConfiguration(config.sportsground.id)
            return (
            <Card key={config.id} className={`hover:shadow-md transition-shadow relative ${selected ? 'ring-2 ring-green-500' : ''}`}>
              {/* Selection checkbox */}
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={!canAdd && !selected}
                  onChange={() => handleToggleSelection(config)}
                  className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-white shadow-sm"
                  title={!canAdd && !selected ? `Only configurations from ${cartSportsgroundName} can be selected` : 'Add to booking cart'}
                />
              </div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pl-7">
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
          )})}
        </div>
      )}

      {/* Results count */}
      {!isLoading && configurations.length > 0 && (
        <div className="mt-6 text-sm text-gray-500 text-center">
          Showing {filteredAndSortedConfigurations.length} of {configurations.length} configurations
        </div>
      )}

      {/* Floating booking cart */}
      <FloatingCart />
    </div>
  )
}
