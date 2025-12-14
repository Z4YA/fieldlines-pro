'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface GoogleMapProps {
  initialCenter?: { lat: number; lng: number }
  initialZoom?: number
  center?: { lat: number; lng: number } | null  // Controlled center - map pans here when changed
  zoom?: number  // Controlled zoom - map zooms here when changed
  onMapClick?: (latLng: { lat: number; lng: number }) => void
  onMapMove?: (center: { lat: number; lng: number }, zoom: number) => void
  markerPosition?: { lat: number; lng: number } | null
  className?: string
  interactive?: boolean
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
}

// Load Google Maps script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve()
      return
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
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

export function GoogleMap({
  initialCenter = { lat: -33.8688, lng: 151.2093 }, // Sydney default
  initialZoom = 15,
  center,
  zoom,
  onMapClick,
  onMapMove,
  markerPosition,
  className = '',
  interactive = true,
  mapType = 'satellite',
}: GoogleMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !GOOGLE_API_KEY) return

    loadGoogleMapsScript(GOOGLE_API_KEY)
      .then(() => {
        if (!mapContainer.current || mapRef.current) return

        const map = new google.maps.Map(mapContainer.current, {
          center: initialCenter,
          zoom: initialZoom,
          mapTypeId: mapType,
          disableDefaultUI: !interactive,
          zoomControl: interactive,
          mapTypeControl: interactive,
          streetViewControl: false,
          fullscreenControl: interactive,
          gestureHandling: interactive ? 'auto' : 'none',
        })

        mapRef.current = map

        map.addListener('tilesloaded', () => {
          setIsLoaded(true)
        })

        if (onMapClick) {
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() })
            }
          })
        }

        if (onMapMove) {
          map.addListener('idle', () => {
            const center = map.getCenter()
            const zoom = map.getZoom()
            if (center && zoom !== undefined) {
              onMapMove({ lat: center.lat(), lng: center.lng() }, zoom)
            }
          })
        }
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error)
      })

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
      mapRef.current = null
    }
  }, [GOOGLE_API_KEY])

  // Update marker position
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }

    // Add new marker if position provided
    if (markerPosition) {
      markerRef.current = new google.maps.Marker({
        position: markerPosition,
        map: mapRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#16a34a',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })
    }
  }, [markerPosition, isLoaded])

  // Pan to controlled center/zoom when they change
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return

    if (center) {
      mapRef.current.panTo(center)
    }
    if (zoom !== undefined) {
      mapRef.current.setZoom(zoom)
    }
  }, [center, zoom, isLoaded])

  // Fly to location
  const panTo = useCallback((centerPos: { lat: number; lng: number }, zoomLevel?: number) => {
    if (mapRef.current) {
      mapRef.current.panTo(centerPos)
      if (zoomLevel !== undefined) {
        mapRef.current.setZoom(zoomLevel)
      }
    }
  }, [])

  // Get current center
  const getCenter = useCallback((): { lat: number; lng: number } | null => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter()
      if (center) {
        return { lat: center.lat(), lng: center.lng() }
      }
    }
    return null
  }, [])

  // Get current zoom
  const getZoom = useCallback((): number | null => {
    if (mapRef.current) {
      return mapRef.current.getZoom() ?? null
    }
    return null
  }, [])

  // Expose methods
  useEffect(() => {
    if (mapContainer.current) {
      const container = mapContainer.current as HTMLDivElement & {
        panTo: typeof panTo
        getCenter: typeof getCenter
        getZoom: typeof getZoom
        map: google.maps.Map | null
      }
      container.panTo = panTo
      container.getCenter = getCenter
      container.getZoom = getZoom
      container.map = mapRef.current
    }
  }, [isLoaded, panTo, getCenter, getZoom])

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function useGoogleMapRef() {
  const mapRef = useRef<HTMLDivElement & {
    panTo: (center: { lat: number; lng: number }, zoom?: number) => void
    getCenter: () => { lat: number; lng: number } | null
    getZoom: () => number | null
    map: google.maps.Map | null
  }>(null)

  return mapRef
}
