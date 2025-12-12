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

interface GooglePlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface GooglePlaceDetails {
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  formatted_address: string
  name: string
}

export function LocationSearch({
  onSelect,
  placeholder = 'Search for a park, oval or address...',
  className = '',
  initialValue = '',
}: LocationSearchProps) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<SearchResult[]>([])
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  // Search for locations using Google Places Autocomplete API
  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([])
      setPredictions([])
      return
    }

    setIsLoading(true)

    try {
      // Use Google Places Autocomplete API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
          `input=${encodeURIComponent(searchQuery)}&` +
          `types=establishment|park|locality|sublocality|geocode&` +
          `components=country:au&` +
          `key=${GOOGLE_API_KEY}`
      )

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()

      if (data.status === 'OK' && data.predictions) {
        setPredictions(data.predictions)

        // Convert to SearchResult format (without coordinates yet)
        const searchResults: SearchResult[] = data.predictions.map((prediction: GooglePlacePrediction) => ({
          id: prediction.place_id,
          placeName: prediction.description,
          center: [0, 0] as [number, number], // Will be filled on selection
          address: prediction.description,
        }))

        setResults(searchResults)
        setIsOpen(searchResults.length > 0)
      } else {
        setResults([])
        setPredictions([])
      }
    } catch (error) {
      console.error('Google Places error:', error)
      setResults([])
      setPredictions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Get place details (coordinates) when a place is selected
  const getPlaceDetails = async (placeId: string): Promise<GooglePlaceDetails | null> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?` +
          `place_id=${placeId}&` +
          `fields=geometry,formatted_address,name&` +
          `key=${GOOGLE_API_KEY}`
      )

      if (!response.ok) throw new Error('Failed to get place details')

      const data = await response.json()

      if (data.status === 'OK' && data.result) {
        return data.result
      }
      return null
    } catch (error) {
      console.error('Place details error:', error)
      return null
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
  const handleSelect = async (result: SearchResult) => {
    setIsLoading(true)
    setQuery(result.placeName)
    setIsOpen(false)
    setSelectedIndex(-1)

    // Get the actual coordinates from Place Details API
    const details = await getPlaceDetails(result.id)

    if (details) {
      const finalResult: SearchResult = {
        id: result.id,
        placeName: details.name || result.placeName,
        center: [details.geometry.location.lng, details.geometry.location.lat],
        address: details.formatted_address || result.address,
      }
      setQuery(finalResult.address)
      onSelect(finalResult)
    } else {
      // Fallback if details fetch fails
      onSelect(result)
    }

    setIsLoading(false)
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

        // Reverse geocode using Google
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?` +
              `latlng=${latitude},${longitude}&` +
              `key=${GOOGLE_API_KEY}`
          )

          if (response.ok) {
            const data = await response.json()
            if (data.status === 'OK' && data.results && data.results.length > 0) {
              const place = data.results[0]
              const result: SearchResult = {
                id: place.place_id,
                placeName: place.formatted_address,
                center: [longitude, latitude],
                address: place.formatted_address,
              }
              setQuery(result.address)
              onSelect(result)
            } else {
              // No address found, use coordinates
              const result: SearchResult = {
                id: 'current-location',
                placeName: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                center: [longitude, latitude],
                address: 'Current Location',
              }
              setQuery(result.placeName)
              onSelect(result)
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
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelect(results[index])}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-gray-50' : ''
              } ${index !== predictions.length - 1 ? 'border-b border-gray-100' : ''}`}
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
                    {prediction.structured_formatting.main_text}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {prediction.structured_formatting.secondary_text}
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
