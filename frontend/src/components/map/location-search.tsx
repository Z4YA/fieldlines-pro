'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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


// Load Google Maps script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve()
      return
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps script'))
    document.head.appendChild(script)
  })
}

export function LocationSearch({
  onSelect,
  placeholder = 'Search for a park, oval or address...',
  className = '',
  initialValue = '',
}: LocationSearchProps) {
  const [query, setQuery] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  // Initialize Google Places Autocomplete
  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places || autocompleteRef.current) {
      return
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'au' },
      fields: ['place_id', 'geometry', 'name', 'formatted_address'],
      types: ['establishment', 'geocode'],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()

      if (place.geometry?.location) {
        const result: SearchResult = {
          id: place.place_id || 'selected-place',
          placeName: place.name || place.formatted_address || '',
          center: [place.geometry.location.lng(), place.geometry.location.lat()],
          address: place.formatted_address || place.name || '',
        }

        setQuery(result.address)
        onSelect(result)
      }
    })

    autocompleteRef.current = autocomplete
  }, [onSelect])

  // Load Google Maps script on mount
  useEffect(() => {
    if (!GOOGLE_API_KEY) {
      console.error('Google Places API key not configured')
      return
    }

    loadGoogleMapsScript(GOOGLE_API_KEY)
      .then(() => {
        setIsScriptLoaded(true)
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error)
      })
  }, [GOOGLE_API_KEY])

  // Initialize autocomplete when script is loaded
  useEffect(() => {
    if (isScriptLoaded) {
      initAutocomplete()
    }
  }, [isScriptLoaded, initAutocomplete])

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

        // Use Google Geocoding for reverse lookup
        if (window.google?.maps) {
          const geocoder = new window.google.maps.Geocoder()
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              setIsLoading(false)
              if (status === 'OK' && results && results[0]) {
                const place = results[0]
                const result: SearchResult = {
                  id: place.place_id || 'current-location',
                  placeName: place.formatted_address,
                  center: [longitude, latitude],
                  address: place.formatted_address,
                }
                setQuery(result.address)
                onSelect(result)
              } else {
                // Fallback to coordinates
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
          )
        } else {
          setIsLoading(false)
          const result: SearchResult = {
            id: 'current-location',
            placeName: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            center: [longitude, latitude],
            address: 'Current Location',
          }
          setQuery(result.placeName)
          onSelect(result)
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
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
    </div>
  )
}
