'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Sportsground {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  defaultZoom: number
}

interface FieldTemplate {
  id: string
  sport: string
  name: string
  minLength: number
  maxLength: number
  minWidth: number
  maxWidth: number
  defaultLength: number
  defaultWidth: number
}

const LINE_COLORS = [
  { name: 'White', value: 'white', hex: '#FFFFFF' },
  { name: 'Yellow', value: 'yellow', hex: '#FFFF00' },
  { name: 'Blue', value: 'blue', hex: '#0066FF' },
  { name: 'Orange', value: 'orange', hex: '#FF6600' },
  { name: 'Red', value: 'red', hex: '#FF0000' },
]

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps script'))
    document.head.appendChild(script)
  })
}

export default function EditorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sportsgroundId = searchParams.get('sportsground')
  const configurationId = searchParams.get('configuration')

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const fieldOverlaysRef = useRef<google.maps.Polyline[]>([])
  const dragMarkerRef = useRef<google.maps.Marker | null>(null)

  const [sportsground, setSportsground] = useState<Sportsground | null>(null)
  const [templates, setTemplates] = useState<FieldTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<FieldTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [configName, setConfigName] = useState('')
  const [saveError, setSaveError] = useState('')

  // Field state
  const [fieldPlaced, setFieldPlaced] = useState(false)
  const [fieldCenter, setFieldCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [fieldLength, setFieldLength] = useState(100)
  const [fieldWidth, setFieldWidth] = useState(64)
  const [lineColor, setLineColor] = useState('white')
  const [rotation, setRotation] = useState(0)

  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)

      const templatesResponse = await api.getTemplates()
      if (templatesResponse.data) {
        setTemplates(templatesResponse.data)
        if (templatesResponse.data.length > 0) {
          const defaultTemplate = templatesResponse.data[0]
          setSelectedTemplate(defaultTemplate)
          setFieldLength(defaultTemplate.defaultLength)
          setFieldWidth(defaultTemplate.defaultWidth)
        }
      }

      if (sportsgroundId) {
        const groundResponse = await api.getSportsground(sportsgroundId)
        if (groundResponse.data) {
          setSportsground(groundResponse.data as Sportsground)
        }
      }

      if (configurationId) {
        const configResponse = await api.getConfiguration(configurationId)
        if (configResponse.data) {
          const config = configResponse.data as {
            lengthMeters: number
            widthMeters: number
            lineColor: string
            rotationDegrees: number
            latitude: number
            longitude: number
            name: string
          }
          setFieldLength(config.lengthMeters)
          setFieldWidth(config.widthMeters)
          setLineColor(config.lineColor)
          setRotation(config.rotationDegrees)
          setFieldCenter({ lat: config.latitude, lng: config.longitude })
          setFieldPlaced(true)
          setConfigName(config.name)
        }
      }

      setIsLoading(false)
    }

    loadData()
  }, [sportsgroundId, configurationId])

  // Initialize Google Map
  useEffect(() => {
    if (!GOOGLE_API_KEY || isLoading) return

    loadGoogleMapsScript(GOOGLE_API_KEY)
      .then(() => {
        if (!mapContainerRef.current || mapRef.current) return

        const center = sportsground
          ? { lat: sportsground.latitude, lng: sportsground.longitude }
          : { lat: -33.8688, lng: 151.2093 }

        const map = new google.maps.Map(mapContainerRef.current, {
          center,
          zoom: sportsground?.defaultZoom || 18,
          mapTypeId: 'satellite',
          tilt: 0,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        })

        mapRef.current = map

        map.addListener('tilesloaded', () => {
          setIsMapLoaded(true)
        })

        // Click to place field
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng && selectedTemplate && !fieldPlaced) {
            setFieldCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() })
            setFieldPlaced(true)
          }
        })
      })
      .catch(console.error)

    return () => {
      fieldOverlaysRef.current.forEach(overlay => overlay.setMap(null))
      fieldOverlaysRef.current = []
      if (dragMarkerRef.current) {
        dragMarkerRef.current.setMap(null)
      }
      mapRef.current = null
    }
  }, [GOOGLE_API_KEY, isLoading, sportsground])

  // Helper to convert local coordinates to lat/lng with rotation
  const toLatLng = useCallback(
    (center: { lat: number; lng: number }, x: number, y: number) => {
      // x is along the width (goal line direction), y is along the length (touchline direction)
      const metersPerDegreeLat = 111320
      const metersPerDegreeLng = 111320 * Math.cos((center.lat * Math.PI) / 180)

      const rotationRad = (rotation * Math.PI) / 180

      // Convert meters to degrees
      const dLat = y / metersPerDegreeLat
      const dLng = x / metersPerDegreeLng

      // Apply rotation
      const rotatedLat = dLat * Math.cos(rotationRad) - dLng * Math.sin(rotationRad)
      const rotatedLng = dLat * Math.sin(rotationRad) + dLng * Math.cos(rotationRad)

      return {
        lat: center.lat + rotatedLat,
        lng: center.lng + rotatedLng,
      }
    },
    [rotation]
  )

  // Generate soccer field lines
  const generateSoccerFieldLines = useCallback(
    (center: { lat: number; lng: number }) => {
      const L = fieldLength // Total length (touchline)
      const W = fieldWidth  // Total width (goal line)

      // Standard soccer field dimensions (scaled to actual field size)
      // All measurements from center of field
      const halfL = L / 2
      const halfW = W / 2

      // Penalty area: 16.5m from goal line, 40.3m wide (20.15m each side of goal)
      const penaltyDepth = 16.5
      const penaltyWidth = 40.3 / 2

      // Goal area: 5.5m from goal line, 18.3m wide (9.15m each side of goal)
      const goalAreaDepth = 5.5
      const goalAreaWidth = 18.3 / 2

      // Center circle radius: 9.15m
      const centerCircleRadius = 9.15

      // Penalty spot: 11m from goal line
      const penaltySpotDist = 11

      // Penalty arc radius: 9.15m from penalty spot
      const penaltyArcRadius = 9.15

      // Corner arc radius: 1m
      const cornerArcRadius = 1

      const lines: { lat: number; lng: number }[][] = []

      // 1. Outer boundary (rectangle)
      lines.push([
        toLatLng(center, -halfW, -halfL),
        toLatLng(center, halfW, -halfL),
        toLatLng(center, halfW, halfL),
        toLatLng(center, -halfW, halfL),
        toLatLng(center, -halfW, -halfL),
      ])

      // 2. Center line
      lines.push([
        toLatLng(center, -halfW, 0),
        toLatLng(center, halfW, 0),
      ])

      // 3. Center circle (approximated with points)
      const centerCircle: { lat: number; lng: number }[] = []
      for (let i = 0; i <= 36; i++) {
        const angle = (i / 36) * 2 * Math.PI
        centerCircle.push(
          toLatLng(center, centerCircleRadius * Math.cos(angle), centerCircleRadius * Math.sin(angle))
        )
      }
      lines.push(centerCircle)

      // 4. Top penalty area (y = halfL side)
      lines.push([
        toLatLng(center, -penaltyWidth, halfL),
        toLatLng(center, -penaltyWidth, halfL - penaltyDepth),
        toLatLng(center, penaltyWidth, halfL - penaltyDepth),
        toLatLng(center, penaltyWidth, halfL),
      ])

      // 5. Bottom penalty area (y = -halfL side)
      lines.push([
        toLatLng(center, -penaltyWidth, -halfL),
        toLatLng(center, -penaltyWidth, -halfL + penaltyDepth),
        toLatLng(center, penaltyWidth, -halfL + penaltyDepth),
        toLatLng(center, penaltyWidth, -halfL),
      ])

      // 6. Top goal area
      lines.push([
        toLatLng(center, -goalAreaWidth, halfL),
        toLatLng(center, -goalAreaWidth, halfL - goalAreaDepth),
        toLatLng(center, goalAreaWidth, halfL - goalAreaDepth),
        toLatLng(center, goalAreaWidth, halfL),
      ])

      // 7. Bottom goal area
      lines.push([
        toLatLng(center, -goalAreaWidth, -halfL),
        toLatLng(center, -goalAreaWidth, -halfL + goalAreaDepth),
        toLatLng(center, goalAreaWidth, -halfL + goalAreaDepth),
        toLatLng(center, goalAreaWidth, -halfL),
      ])

      // 8. Top penalty arc (arc outside penalty area)
      const topPenaltyArc: { lat: number; lng: number }[] = []
      const topPenaltySpotY = halfL - penaltySpotDist
      for (let i = -10; i <= 10; i++) {
        const angle = (i / 10) * (Math.PI / 3) - Math.PI / 2 // Arc facing down
        const px = penaltyArcRadius * Math.cos(angle)
        const py = topPenaltySpotY + penaltyArcRadius * Math.sin(angle)
        if (py < halfL - penaltyDepth) {
          topPenaltyArc.push(toLatLng(center, px, py))
        }
      }
      if (topPenaltyArc.length > 1) lines.push(topPenaltyArc)

      // 9. Bottom penalty arc
      const bottomPenaltyArc: { lat: number; lng: number }[] = []
      const bottomPenaltySpotY = -halfL + penaltySpotDist
      for (let i = -10; i <= 10; i++) {
        const angle = (i / 10) * (Math.PI / 3) + Math.PI / 2 // Arc facing up
        const px = penaltyArcRadius * Math.cos(angle)
        const py = bottomPenaltySpotY + penaltyArcRadius * Math.sin(angle)
        if (py > -halfL + penaltyDepth) {
          bottomPenaltyArc.push(toLatLng(center, px, py))
        }
      }
      if (bottomPenaltyArc.length > 1) lines.push(bottomPenaltyArc)

      // 10. Corner arcs
      // Top-left corner
      const topLeftCorner: { lat: number; lng: number }[] = []
      for (let i = 0; i <= 9; i++) {
        const angle = (i / 9) * (Math.PI / 2)
        topLeftCorner.push(
          toLatLng(center, -halfW + cornerArcRadius * Math.sin(angle), halfL - cornerArcRadius * Math.cos(angle))
        )
      }
      lines.push(topLeftCorner)

      // Top-right corner
      const topRightCorner: { lat: number; lng: number }[] = []
      for (let i = 0; i <= 9; i++) {
        const angle = (i / 9) * (Math.PI / 2)
        topRightCorner.push(
          toLatLng(center, halfW - cornerArcRadius * Math.sin(angle), halfL - cornerArcRadius * Math.cos(angle))
        )
      }
      lines.push(topRightCorner)

      // Bottom-left corner
      const bottomLeftCorner: { lat: number; lng: number }[] = []
      for (let i = 0; i <= 9; i++) {
        const angle = (i / 9) * (Math.PI / 2)
        bottomLeftCorner.push(
          toLatLng(center, -halfW + cornerArcRadius * Math.sin(angle), -halfL + cornerArcRadius * Math.cos(angle))
        )
      }
      lines.push(bottomLeftCorner)

      // Bottom-right corner
      const bottomRightCorner: { lat: number; lng: number }[] = []
      for (let i = 0; i <= 9; i++) {
        const angle = (i / 9) * (Math.PI / 2)
        bottomRightCorner.push(
          toLatLng(center, halfW - cornerArcRadius * Math.sin(angle), -halfL + cornerArcRadius * Math.cos(angle))
        )
      }
      lines.push(bottomRightCorner)

      return lines
    },
    [fieldLength, fieldWidth, toLatLng]
  )

  // Draw/update field overlay
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !fieldCenter || !fieldPlaced) return

    const colorHex = LINE_COLORS.find((c) => c.value === lineColor)?.hex || '#FFFFFF'

    // Clear existing overlays
    fieldOverlaysRef.current.forEach(overlay => overlay.setMap(null))
    fieldOverlaysRef.current = []

    // Generate field lines
    const fieldLines = generateSoccerFieldLines(fieldCenter)

    // Create polylines for each line
    fieldLines.forEach((linePath) => {
      const polyline = new google.maps.Polyline({
        path: linePath,
        strokeColor: colorHex,
        strokeOpacity: 1,
        strokeWeight: 2,
        map: mapRef.current,
      })
      fieldOverlaysRef.current.push(polyline)
    })

    // Add draggable marker at center for repositioning
    if (dragMarkerRef.current) {
      dragMarkerRef.current.setPosition(fieldCenter)
    } else {
      const marker = new google.maps.Marker({
        position: fieldCenter,
        map: mapRef.current,
        draggable: true,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#22c55e',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        title: 'Drag to move field',
      })

      marker.addListener('drag', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          setFieldCenter({ lat: e.latLng.lat(), lng: e.latLng.lng() })
        }
      })

      dragMarkerRef.current = marker
    }
  }, [fieldCenter, fieldPlaced, fieldLength, fieldWidth, lineColor, rotation, isMapLoaded, generateSoccerFieldLines])

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setFieldLength(template.defaultLength)
      setFieldWidth(template.defaultWidth)
    }
  }

  // Handle dimension changes
  const handleLengthChange = (value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num) && selectedTemplate) {
      setFieldLength(Math.min(Math.max(num, selectedTemplate.minLength), selectedTemplate.maxLength))
    }
  }

  const handleWidthChange = (value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num) && selectedTemplate) {
      setFieldWidth(Math.min(Math.max(num, selectedTemplate.minWidth), selectedTemplate.maxWidth))
    }
  }

  // Reset field
  const handleReset = () => {
    fieldOverlaysRef.current.forEach(overlay => overlay.setMap(null))
    fieldOverlaysRef.current = []
    if (dragMarkerRef.current) {
      dragMarkerRef.current.setMap(null)
      dragMarkerRef.current = null
    }
    setFieldPlaced(false)
    setFieldCenter(null)
    if (selectedTemplate) {
      setFieldLength(selectedTemplate.defaultLength)
      setFieldWidth(selectedTemplate.defaultWidth)
    }
    setRotation(0)
  }

  // Save configuration
  const handleSave = async () => {
    if (!configName.trim()) {
      setSaveError('Please enter a configuration name')
      return
    }

    if (!sportsgroundId || !fieldCenter || !selectedTemplate) {
      setSaveError('Missing required data')
      return
    }

    setIsSaving(true)
    setSaveError('')

    const configData = {
      sportsgroundId,
      templateId: selectedTemplate.id,
      name: configName,
      latitude: fieldCenter.lat,
      longitude: fieldCenter.lng,
      rotationDegrees: rotation,
      lengthMeters: fieldLength,
      widthMeters: fieldWidth,
      lineColor,
    }

    let response
    if (configurationId) {
      response = await api.updateConfiguration(configurationId, configData)
    } else {
      response = await api.createConfiguration(configData)
    }

    if (response.error) {
      setSaveError(response.error)
    } else {
      setShowSaveModal(false)
      const savedConfig = response.data as { id: string }
      router.push(`/dashboard/configurations/${savedConfig.id}`)
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Top toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between z-20">
        <div className="flex items-center space-x-4">
          <Link href={sportsground ? `/dashboard/sportsgrounds/${sportsground.id}` : '/dashboard/sportsgrounds'}>
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </Link>
          {sportsground && (
            <div>
              <h1 className="font-semibold text-gray-900">{sportsground.name}</h1>
              <p className="text-xs text-gray-500">{sportsground.address}</p>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </Button>
          <Button size="sm" onClick={() => setShowSaveModal(true)} disabled={!fieldPlaced}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left control panel */}
        <div className="w-80 bg-white border-r overflow-y-auto z-10">
          <div className="p-4 space-y-6">
            {/* Instructions */}
            {!fieldPlaced && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How to use</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Select a field template below</li>
                  <li>Click on the map to place the field</li>
                  <li>Drag to reposition, drag corners to resize</li>
                  <li>Adjust settings and save</li>
                </ol>
              </div>
            )}

            {/* Template selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Field Template</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedTemplate.sport} - {selectedTemplate.minLength}-{selectedTemplate.maxLength}m x{' '}
                    {selectedTemplate.minWidth}-{selectedTemplate.maxWidth}m
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Dimensions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Dimensions (meters)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="length" className="text-xs">
                    Length: {selectedTemplate?.minLength}-{selectedTemplate?.maxLength}m
                  </Label>
                  <Input
                    id="length"
                    type="number"
                    value={fieldLength}
                    onChange={(e) => handleLengthChange(e.target.value)}
                    min={selectedTemplate?.minLength}
                    max={selectedTemplate?.maxLength}
                    step={1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="width" className="text-xs">
                    Width: {selectedTemplate?.minWidth}-{selectedTemplate?.maxWidth}m
                  </Label>
                  <Input
                    id="width"
                    type="number"
                    value={fieldWidth}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    min={selectedTemplate?.minWidth}
                    max={selectedTemplate?.maxWidth}
                    step={1}
                    className="mt-1"
                  />
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  Current: {fieldLength}m x {fieldWidth}m
                </div>
              </CardContent>
            </Card>

            {/* Rotation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Rotation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value) || 0)}
                    min={0}
                    max={359}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">degrees</span>
                </div>
                <input
                  type="range"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  min={0}
                  max={359}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <button type="button" onClick={() => setRotation(0)} className="hover:text-green-600">0°</button>
                  <button type="button" onClick={() => setRotation(45)} className="hover:text-green-600">45°</button>
                  <button type="button" onClick={() => setRotation(90)} className="hover:text-green-600">90°</button>
                  <button type="button" onClick={() => setRotation(135)} className="hover:text-green-600">135°</button>
                  <button type="button" onClick={() => setRotation(180)} className="hover:text-green-600">180°</button>
                </div>
              </CardContent>
            </Card>

            {/* Line Color */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Line Color</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {LINE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setLineColor(color.value)}
                      className={`p-2 rounded-md border-2 flex flex-col items-center ${
                        lineColor === color.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hex }}
                      ></div>
                      <span className="text-xs mt-1">{color.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Field Status */}
            {fieldPlaced && fieldCenter && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Field Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Lat: {fieldCenter.lat.toFixed(6)}</p>
                    <p>Lng: {fieldCenter.lng.toFixed(6)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Map area */}
        <div className="flex-1 relative min-h-0">
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

          {/* Placement hint overlay */}
          {!fieldPlaced && isMapLoaded && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm z-10">
              Click on the map to place your field
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Save Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {saveError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {saveError}
                </div>
              )}
              <div>
                <Label htmlFor="configName">Configuration Name *</Label>
                <Input
                  id="configName"
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  placeholder="e.g., Main Field - Winter 2025"
                  className="mt-1"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                <p className="font-medium text-gray-900 mb-2">Configuration Summary</p>
                <div className="space-y-1 text-gray-600">
                  <p>Template: {selectedTemplate?.name}</p>
                  <p>Dimensions: {fieldLength}m x {fieldWidth}m</p>
                  <p>Rotation: {rotation}°</p>
                  <p>Line Color: {lineColor}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : configurationId ? 'Update' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
