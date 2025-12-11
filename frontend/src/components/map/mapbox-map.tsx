'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Set access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface MapboxMapProps {
  initialCenter?: [number, number] // [lng, lat]
  initialZoom?: number
  onMapClick?: (lngLat: { lng: number; lat: number }) => void
  onMapMove?: (center: { lng: number; lat: number }, zoom: number) => void
  markerPosition?: [number, number] | null
  className?: string
  interactive?: boolean
  showSatellite?: boolean
}

export function MapboxMap({
  initialCenter = [151.2093, -33.8688], // Sydney default
  initialZoom = 15,
  onMapClick,
  onMapMove,
  markerPosition,
  className = '',
  interactive = true,
  showSatellite = true,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: showSatellite
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
      interactive,
    })

    map.current.on('load', () => {
      setIsLoaded(true)
    })

    // Add navigation controls
    if (interactive) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: false,
          showUserHeading: false,
        }),
        'top-right'
      )
    }

    // Handle click events
    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat })
      })
    }

    // Handle move events
    if (onMapMove) {
      map.current.on('moveend', () => {
        if (map.current) {
          const center = map.current.getCenter()
          const zoom = map.current.getZoom()
          onMapMove({ lng: center.lng, lat: center.lat }, zoom)
        }
      })
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update marker position
  useEffect(() => {
    if (!map.current || !isLoaded) return

    // Remove existing marker
    if (marker.current) {
      marker.current.remove()
      marker.current = null
    }

    // Add new marker if position provided
    if (markerPosition) {
      marker.current = new mapboxgl.Marker({ color: '#16a34a' })
        .setLngLat(markerPosition)
        .addTo(map.current)
    }
  }, [markerPosition, isLoaded])

  // Method to fly to a location
  const flyTo = (center: [number, number], zoom?: number) => {
    if (map.current) {
      map.current.flyTo({
        center,
        zoom: zoom || map.current.getZoom(),
        duration: 1500,
      })
    }
  }

  // Method to get current center
  const getCenter = (): [number, number] | null => {
    if (map.current) {
      const center = map.current.getCenter()
      return [center.lng, center.lat]
    }
    return null
  }

  // Method to get current zoom
  const getZoom = (): number | null => {
    if (map.current) {
      return map.current.getZoom()
    }
    return null
  }

  // Expose methods via ref
  useEffect(() => {
    if (mapContainer.current) {
      (mapContainer.current as HTMLDivElement & {
        flyTo: typeof flyTo
        getCenter: typeof getCenter
        getZoom: typeof getZoom
        map: mapboxgl.Map | null
      }).flyTo = flyTo;
      (mapContainer.current as HTMLDivElement & {
        flyTo: typeof flyTo
        getCenter: typeof getCenter
        getZoom: typeof getZoom
        map: mapboxgl.Map | null
      }).getCenter = getCenter;
      (mapContainer.current as HTMLDivElement & {
        flyTo: typeof flyTo
        getCenter: typeof getCenter
        getZoom: typeof getZoom
        map: mapboxgl.Map | null
      }).getZoom = getZoom;
      (mapContainer.current as HTMLDivElement & {
        flyTo: typeof flyTo
        getCenter: typeof getCenter
        getZoom: typeof getZoom
        map: mapboxgl.Map | null
      }).map = map.current
    }
  }, [isLoaded])

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

// Hook for using map methods
export function useMapRef() {
  const mapRef = useRef<HTMLDivElement & {
    flyTo: (center: [number, number], zoom?: number) => void
    getCenter: () => [number, number] | null
    getZoom: () => number | null
    map: mapboxgl.Map | null
  }>(null)

  return mapRef
}
