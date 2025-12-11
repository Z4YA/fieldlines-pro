'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as fabric from 'fabric'

interface SoccerFieldProps {
  width: number // Field width in meters
  length: number // Field length in meters
  lineColor: string
  rotation: number // Degrees
  scale: number // Pixels per meter
  onUpdate?: (data: { rotation: number }) => void
}

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
  lineWidth: 0.12, // 12cm line width
}

export function SoccerField({
  width,
  length,
  lineColor,
  rotation,
  scale,
  onUpdate,
}: SoccerFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const fieldGroupRef = useRef<fabric.Group | null>(null)

  // Convert color name to hex
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

  // Create the soccer field elements
  const createFieldElements = useCallback(() => {
    const colorHex = getColorHex(lineColor)
    const strokeWidth = FIELD_SPECS.lineWidth * scale
    const elements: fabric.Object[] = []

    // Field dimensions in pixels
    const fieldWidth = width * scale
    const fieldLength = length * scale

    // Outer boundary
    elements.push(
      new fabric.Rect({
        left: 0,
        top: 0,
        width: fieldWidth,
        height: fieldLength,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        selectable: false,
      })
    )

    // Center line
    elements.push(
      new fabric.Line([0, fieldLength / 2, fieldWidth, fieldLength / 2], {
        stroke: colorHex,
        strokeWidth: strokeWidth,
        selectable: false,
      })
    )

    // Center circle
    elements.push(
      new fabric.Circle({
        left: fieldWidth / 2,
        top: fieldLength / 2,
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
        left: fieldWidth / 2,
        top: fieldLength / 2,
        radius: 0.22 * scale,
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
    const penaltyAreaX = (fieldWidth - penaltyAreaWidth) / 2

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
        top: fieldLength - penaltyAreaDepth,
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
    const goalAreaX = (fieldWidth - goalAreaWidth) / 2

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
        top: fieldLength - goalAreaDepth,
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
        left: fieldWidth / 2,
        top: penaltyMarkY,
        radius: 0.22 * scale,
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
        left: fieldWidth / 2,
        top: fieldLength - penaltyMarkY,
        radius: 0.22 * scale,
        fill: colorHex,
        stroke: colorHex,
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        selectable: false,
      })
    )

    // Penalty arcs (the parts outside the penalty area)
    const penaltyArcRadius = FIELD_SPECS.penaltyArcRadius * scale

    // Top penalty arc
    elements.push(
      new fabric.Circle({
        left: fieldWidth / 2,
        top: penaltyMarkY,
        radius: penaltyArcRadius,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        originX: 'center',
        originY: 'center',
        startAngle: 37,
        endAngle: 143,
        selectable: false,
      })
    )

    // Bottom penalty arc
    elements.push(
      new fabric.Circle({
        left: fieldWidth / 2,
        top: fieldLength - penaltyMarkY,
        radius: penaltyArcRadius,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        originX: 'center',
        originY: 'center',
        startAngle: 217,
        endAngle: 323,
        selectable: false,
      })
    )

    // Corner arcs
    const cornerArcRadius = FIELD_SPECS.cornerArcRadius * scale

    // Top-left corner
    elements.push(
      new fabric.Circle({
        left: 0,
        top: 0,
        radius: cornerArcRadius,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        startAngle: 0,
        endAngle: 90,
        selectable: false,
      })
    )

    // Top-right corner
    elements.push(
      new fabric.Circle({
        left: fieldWidth,
        top: 0,
        radius: cornerArcRadius,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        originX: 'right',
        startAngle: 90,
        endAngle: 180,
        selectable: false,
      })
    )

    // Bottom-left corner
    elements.push(
      new fabric.Circle({
        left: 0,
        top: fieldLength,
        radius: cornerArcRadius,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        originY: 'bottom',
        startAngle: 270,
        endAngle: 360,
        selectable: false,
      })
    )

    // Bottom-right corner
    elements.push(
      new fabric.Circle({
        left: fieldWidth,
        top: fieldLength,
        radius: cornerArcRadius,
        fill: 'transparent',
        stroke: colorHex,
        strokeWidth: strokeWidth,
        originX: 'right',
        originY: 'bottom',
        startAngle: 180,
        endAngle: 270,
        selectable: false,
      })
    )

    return elements
  }, [width, length, lineColor, scale])

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      selection: false,
      backgroundColor: 'transparent',
    })

    fabricRef.current = canvas

    return () => {
      canvas.dispose()
      fabricRef.current = null
    }
  }, [])

  // Update field when props change
  useEffect(() => {
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
      lockMovementX: true,
      lockMovementY: true,
    })

    // Only allow rotation
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
      if (onUpdate) {
        onUpdate({ rotation: group.angle || 0 })
      }
    })

    canvas.renderAll()
  }, [width, length, lineColor, rotation, scale, createFieldElements, onUpdate])

  // Update canvas size
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !canvasRef.current) return

    const container = canvasRef.current.parentElement
    if (!container) return

    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect()

    canvas.setDimensions({
      width: containerWidth,
      height: containerHeight,
    })

    // Re-center the field group
    if (fieldGroupRef.current) {
      fieldGroupRef.current.set({
        left: containerWidth / 2,
        top: containerHeight / 2,
      })
      canvas.renderAll()
    }
  }, [])

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  )
}
