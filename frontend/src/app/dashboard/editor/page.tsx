'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import mapboxgl from 'mapbox-gl'
import * as fabric from 'fabric'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import 'mapbox-gl/dist/mapbox-gl.css'

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

// FIFA Regulations - Fixed dimensions (in meters)
const FIELD_SPECS = {
  centerCircleRadius: 9.15,
  penaltyAreaWidth: 40.3,
  penaltyAreaDepth: 16.5,
  goalAreaWidth: 18.3,
  goalAreaDepth: 5.5,
  penaltyMarkDistance: 11,
  penaltyArcRadius: 9.15,
  cornerArcRadius: 1,
  goalWidth: 7.32,
  lineWidth: 0.12,
}

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
  { name: 'Green', value: 'green', hex: '#00FF00' },
]

export default function EditorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sportsgroundId = searchParams.get('sportsground')
  const configurationId = searchParams.get('configuration')

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const fieldGroupRef = useRef<fabric.Group | null>(null)

  const [sportsground, setSportsground] = useState<Sportsground | null>(null)
  const [templates, setTemplates] = useState<FieldTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<FieldTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [configName, setConfigName] = useState('')
  const [saveError, setSaveError] = useState('')

  // Field configuration state
  const [fieldLength, setFieldLength] = useState(100) // meters
  const [fieldWidth, setFieldWidth] = useState(64) // meters
  const [lineColor, setLineColor] = useState('white')
  const [rotation, setRotation] = useState(0) // degrees
  const [fieldPosition, setFieldPosition] = useState<{ lat: number; lng: number } | null>(null)

  // Scale: pixels per meter (calculated based on zoom level)
  const [scale, setScale] = useState(2)

  // Load sportsground and templates
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)

      // Load templates
      const templatesResponse = await api.getTemplates()
      if (templatesResponse.data) {
        setTemplates(templatesResponse.data)
        // Default to first template (Soccer 11v11)
        if (templatesResponse.data.length > 0) {
          const defaultTemplate = templatesResponse.data[0]
          setSelectedTemplate(defaultTemplate)
          setFieldLength(defaultTemplate.defaultLength)
          setFieldWidth(defaultTemplate.defaultWidth)
        }
      }

      // Load sportsground if ID provided
      if (sportsgroundId) {
        const groundResponse = await api.getSportsground(sportsgroundId)
        if (groundResponse.data) {
          setSportsground(groundResponse.data as Sportsground)
          setFieldPosition({
            lat: (groundResponse.data as Sportsground).latitude,
            lng: (groundResponse.data as Sportsground).longitude,
          })
        }
      }

      // Load existing configuration if ID provided
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
          setFieldPosition({ lat: config.latitude, lng: config.longitude })
          setConfigName(config.name)
        }
      }

      setIsLoading(false)
    }

    loadData()
  }, [sportsgroundId, configurationId])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || isLoading) return

    const center: [number, number] = sportsground
      ? [sportsground.longitude, sportsground.latitude]
      : [151.2093, -33.8688] // Sydney default

    const zoom = sportsground?.defaultZoom || 18

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center,
      zoom,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    mapRef.current = map

    // Update scale based on zoom
    map.on('zoom', () => {
      const currentZoom = map.getZoom()
      // Approximate: at zoom 18, 1 meter ~ 2 pixels
      const newScale = Math.pow(2, currentZoom - 17)
      setScale(newScale)
    })

    // Set initial scale
    const initialScale = Math.pow(2, zoom - 17)
    setScale(initialScale)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [isLoading, sportsground])

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current || isLoading) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      selection: false,
      backgroundColor: 'transparent',
    })

    fabricRef.current = canvas

    // Handle window resize
    const handleResize = () => {
      if (mapContainerRef.current) {
        const { width, height } = mapContainerRef.current.getBoundingClientRect()
        canvas.setDimensions({ width, height })
        updateFieldPosition()
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.dispose()
      fabricRef.current = null
    }
  }, [isLoading])

  // Create field elements
  const createFieldElements = useCallback(() => {
    const colorHex = LINE_COLORS.find((c) => c.value === lineColor)?.hex || '#FFFFFF'
    const strokeWidth = Math.max(FIELD_SPECS.lineWidth * scale, 1)
    const elements: fabric.Object[] = []

    // Field dimensions in pixels
    const fieldWidthPx = fieldWidth * scale
    const fieldLengthPx = fieldLength * scale

    // Outer boundary
    elements.push(
      new fabric.Rect({
        left: 0,
        top: 0,
        width: fieldWidthPx,
        height: fieldLengthPx,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        selectable: false,
      })
    )

    // Center line
    elements.push(
      new fabric.Line([0, fieldLengthPx / 2, fieldWidthPx, fieldLengthPx / 2], {
        stroke: colorHex,
        strokeWidth: strokeWidth,
        selectable: false,
      })
    )

    // Center circle
    elements.push(
      new fabric.Circle({
        left: fieldWidthPx / 2,
        top: fieldLengthPx / 2,
        radius: FIELD_SPECS.centerCircleRadius * scale,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        originX: 'center',
        originY: 'center',
        selectable: false,
      })
    )

    // Center mark
    elements.push(
      new fabric.Circle({
        left: fieldWidthPx / 2,
        top: fieldLengthPx / 2,
        radius: Math.max(0.22 * scale, 2),
        fill: colorHex,
        stroke: colorHex,
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        selectable: false,
      })
    )

    // Penalty areas
    const penaltyAreaWidth = FIELD_SPECS.penaltyAreaWidth * scale
    const penaltyAreaDepth = FIELD_SPECS.penaltyAreaDepth * scale
    const penaltyAreaX = (fieldWidthPx - penaltyAreaWidth) / 2

    // Top penalty area
    elements.push(
      new fabric.Rect({
        left: penaltyAreaX,
        top: 0,
        width: penaltyAreaWidth,
        height: penaltyAreaDepth,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        selectable: false,
      })
    )

    // Bottom penalty area
    elements.push(
      new fabric.Rect({
        left: penaltyAreaX,
        top: fieldLengthPx - penaltyAreaDepth,
        width: penaltyAreaWidth,
        height: penaltyAreaDepth,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        selectable: false,
      })
    )

    // Goal areas
    const goalAreaWidth = FIELD_SPECS.goalAreaWidth * scale
    const goalAreaDepth = FIELD_SPECS.goalAreaDepth * scale
    const goalAreaX = (fieldWidthPx - goalAreaWidth) / 2

    // Top goal area
    elements.push(
      new fabric.Rect({
        left: goalAreaX,
        top: 0,
        width: goalAreaWidth,
        height: goalAreaDepth,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        selectable: false,
      })
    )

    // Bottom goal area
    elements.push(
      new fabric.Rect({
        left: goalAreaX,
        top: fieldLengthPx - goalAreaDepth,
        width: goalAreaWidth,
        height: goalAreaDepth,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        selectable: false,
      })
    )

    // Penalty marks
    const penaltyMarkY = FIELD_SPECS.penaltyMarkDistance * scale

    // Top penalty mark
    elements.push(
      new fabric.Circle({
        left: fieldWidthPx / 2,
        top: penaltyMarkY,
        radius: Math.max(0.22 * scale, 2),
        fill: colorHex,
        stroke: colorHex,
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        selectable: false,
      })
    )

    // Bottom penalty mark
    elements.push(
      new fabric.Circle({
        left: fieldWidthPx / 2,
        top: fieldLengthPx - penaltyMarkY,
        radius: Math.max(0.22 * scale, 2),
        fill: colorHex,
        stroke: colorHex,
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        selectable: false,
      })
    )

    // Penalty arcs (using Path for proper arc rendering)
    const penaltyArcRadius = FIELD_SPECS.penaltyArcRadius * scale

    // Top penalty arc - arc outside penalty area
    const topArcStartAngle = (37 * Math.PI) / 180
    const topArcEndAngle = (143 * Math.PI) / 180
    const topArcPath = createArcPath(
      fieldWidthPx / 2,
      penaltyMarkY,
      penaltyArcRadius,
      topArcStartAngle,
      topArcEndAngle
    )
    elements.push(
      new fabric.Path(topArcPath, {
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        selectable: false,
      })
    )

    // Bottom penalty arc
    const bottomArcStartAngle = (217 * Math.PI) / 180
    const bottomArcEndAngle = (323 * Math.PI) / 180
    const bottomArcPath = createArcPath(
      fieldWidthPx / 2,
      fieldLengthPx - penaltyMarkY,
      penaltyArcRadius,
      bottomArcStartAngle,
      bottomArcEndAngle
    )
    elements.push(
      new fabric.Path(bottomArcPath, {
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        selectable: false,
      })
    )

    // Corner arcs
    const cornerArcRadius = FIELD_SPECS.cornerArcRadius * scale

    // Top-left corner
    elements.push(
      new fabric.Path(createArcPath(0, 0, cornerArcRadius, 0, Math.PI / 2), {
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        selectable: false,
      })
    )

    // Top-right corner
    elements.push(
      new fabric.Path(createArcPath(fieldWidthPx, 0, cornerArcRadius, Math.PI / 2, Math.PI), {
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        selectable: false,
      })
    )

    // Bottom-left corner
    elements.push(
      new fabric.Path(
        createArcPath(0, fieldLengthPx, cornerArcRadius, (3 * Math.PI) / 2, 2 * Math.PI),
        {
          fill: 'transparent',
          stroke: colorHex,
          strokeWidth: strokeWidth,
          selectable: false,
        }
      )
    )

    // Bottom-right corner
    elements.push(
      new fabric.Path(
        createArcPath(fieldWidthPx, fieldLengthPx, cornerArcRadius, Math.PI, (3 * Math.PI) / 2),
        {
          fill: 'transparent',
          stroke: colorHex,
          strokeWidth: strokeWidth,
          selectable: false,
        }
      )
    )

    return elements
  }, [fieldWidth, fieldLength, lineColor, scale])

  // Helper function to create SVG arc path
  const createArcPath = (
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ): string => {
    const startX = cx + radius * Math.cos(startAngle)
    const startY = cy + radius * Math.sin(startAngle)
    const endX = cx + radius * Math.cos(endAngle)
    const endY = cy + radius * Math.sin(endAngle)
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`
  }

  // Update field on canvas
  const updateFieldPosition = useCallback(() => {
    const canvas = fabricRef.current
    if (!canvas) return

    // Clear existing objects
    canvas.clear()

    // Create field elements
    const elements = createFieldElements()

    // Group all elements
    const group = new fabric.Group(elements, {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      angle: rotation,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockScalingX: true,
      lockScalingY: true,
      borderColor: '#00ff00',
      cornerColor: '#00ff00',
      cornerSize: 10,
      transparentCorners: false,
    })

    // Only allow rotation and movement
    group.setControlsVisibility({
      mt: false,
      mb: false,
      ml: false,
      mr: false,
      tl: false,
      tr: false,
      bl: false,
      br: false,
      mtr: true, // Rotation control
    })

    canvas.add(group)
    fieldGroupRef.current = group

    // Handle rotation
    group.on('rotating', () => {
      setRotation(Math.round(group.angle || 0))
    })

    // Handle movement
    group.on('moving', () => {
      // Update field position based on map coordinates
      if (mapRef.current && group.left && group.top) {
        const point = mapRef.current.unproject([group.left, group.top])
        setFieldPosition({ lat: point.lat, lng: point.lng })
      }
    })

    canvas.renderAll()
  }, [createFieldElements, rotation])

  // Update canvas when parameters change
  useEffect(() => {
    if (!isLoading && fabricRef.current) {
      updateFieldPosition()
    }
  }, [isLoading, fieldWidth, fieldLength, lineColor, rotation, scale, updateFieldPosition])

  // Handle dimension changes with validation
  const handleLengthChange = (value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num) && selectedTemplate) {
      const clamped = Math.min(Math.max(num, selectedTemplate.minLength), selectedTemplate.maxLength)
      setFieldLength(clamped)
    }
  }

  const handleWidthChange = (value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num) && selectedTemplate) {
      const clamped = Math.min(Math.max(num, selectedTemplate.minWidth), selectedTemplate.maxWidth)
      setFieldWidth(clamped)
    }
  }

  const handleRotationChange = (value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num)) {
      setRotation(((num % 360) + 360) % 360)
    }
  }

  // Save configuration
  const handleSave = async () => {
    if (!configName.trim()) {
      setSaveError('Please enter a configuration name')
      return
    }

    if (!sportsgroundId) {
      setSaveError('No sportsground selected')
      return
    }

    if (!selectedTemplate) {
      setSaveError('No template selected')
      return
    }

    setIsSaving(true)
    setSaveError('')

    const configData = {
      sportsgroundId,
      templateId: selectedTemplate.id,
      name: configName,
      latitude: fieldPosition?.lat || sportsground?.latitude || 0,
      longitude: fieldPosition?.lng || sportsground?.longitude || 0,
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
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
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
          <Button variant="outline" size="sm" onClick={() => updateFieldPosition()}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </Button>
          <Button size="sm" onClick={() => setShowSaveModal(true)}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save Configuration
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left control panel */}
        <div className="w-80 bg-white border-r overflow-y-auto z-10">
          <div className="p-4 space-y-6">
            {/* Template selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Field Template</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const template = templates.find((t) => t.id === e.target.value)
                    if (template) {
                      setSelectedTemplate(template)
                      setFieldLength(template.defaultLength)
                      setFieldWidth(template.defaultWidth)
                    }
                  }}
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
                    Length (Touchline): {selectedTemplate?.minLength}-{selectedTemplate?.maxLength}m
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
                    Width (Goal Line): {selectedTemplate?.minWidth}-{selectedTemplate?.maxWidth}m
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
                    onChange={(e) => handleRotationChange(e.target.value)}
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
                  <button onClick={() => setRotation(0)} className="hover:text-green-600">0°</button>
                  <button onClick={() => setRotation(45)} className="hover:text-green-600">45°</button>
                  <button onClick={() => setRotation(90)} className="hover:text-green-600">90°</button>
                  <button onClick={() => setRotation(135)} className="hover:text-green-600">135°</button>
                  <button onClick={() => setRotation(180)} className="hover:text-green-600">180°</button>
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

            {/* Instructions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Drag field to reposition</li>
                  <li>• Use rotation handle or slider to rotate</li>
                  <li>• Adjust dimensions using inputs</li>
                  <li>• Select line color for visibility</li>
                  <li>• Save when positioning is complete</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map and canvas area */}
        <div className="flex-1 relative">
          <div ref={mapContainerRef} className="absolute inset-0" />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-auto"
            style={{ zIndex: 10 }}
          />
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
