'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'

interface SearchResult {
  id: string
  placeName: string
  center: [number, number] // [lng, lat]
  address: string
}

interface LocationSearchProps {
  onSelect: (result: SearchResult) => void
  placeholder?: string
  className?: string
  initialValue?: string
}

export function LocationSearch({
  onSelect,
  placeholder = 'Search for an address...',
  className = '',
  initialValue = '',
}: LocationSearchProps) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Search for locations using Mapbox Geocoding API
  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([])
      return
    }

    setIsLoading(true)

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
          `access_token=${token}&` +
          `types=address,poi,locality,place&` +
          `limit=5&` +
          `country=au` // Limit to Australia, remove or modify for other countries
      )

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()

      const searchResults: SearchResult[] = data.features.map((feature: {
        id: string
        place_name: string
        center: [number, number]
        text: string
        context?: Array<{ text: string }>
      }) => ({
        id: feature.id,
        placeName: feature.place_name,
        center: feature.center,
        address: feature.place_name,
      }))

      setResults(searchResults)
      setIsOpen(searchResults.length > 0)
    } catch (error) {
      console.error('Geocoding error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      searchLocations(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    setQuery(result.placeName)
    setIsOpen(false)
    setSelectedIndex(-1)
    onSelect(result)
  }

  // Get user's current location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Reverse geocode to get address
        try {
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?` +
              `access_token=${token}&` +
              `types=address,poi&` +
              `limit=1`
          )

          if (response.ok) {
            const data = await response.json()
            if (data.features && data.features.length > 0) {
              const feature = data.features[0]
              const result: SearchResult = {
                id: feature.id,
                placeName: feature.place_name,
                center: [longitude, latitude],
                address: feature.place_name,
              }
              handleSelect(result)
            } else {
              // No address found, use coordinates
              const result: SearchResult = {
                id: 'current-location',
                placeName: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                center: [longitude, latitude],
                address: 'Current Location',
              }
              handleSelect(result)
            }
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error)
        } finally {
          setIsLoading(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to get your location. Please search manually.')
        setIsLoading(false)
      }
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          )}
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Use my location"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((result, index) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleSelect(result)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-gray-50' : ''
              } ${index !== results.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {result.placeName.split(',')[0]}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {result.placeName.split(',').slice(1).join(',')}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
