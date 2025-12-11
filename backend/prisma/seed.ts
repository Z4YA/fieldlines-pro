import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Soccer 11v11 field template data based on FIFA regulations
const soccer11v11Template = {
  sport: 'soccer',
  name: '11v11 Full Field',
  description: 'Standard FIFA regulation soccer field for full-sided matches (11 vs 11)',
  minLength: 90,
  maxLength: 120,
  minWidth: 45,
  maxWidth: 90,
  defaultLength: 100,
  defaultWidth: 64,
  interiorElements: {
    elements: [
      {
        id: 'outer_boundary',
        type: 'rectangle',
        description: 'Outer field boundary',
        position: { x: 0, y: 0 },
        size: { width: 'field_width', height: 'field_length' },
      },
      {
        id: 'center_line',
        type: 'line',
        description: 'Halfway line',
        start: { x: 0, y: 'field_length / 2' },
        end: { x: 'field_width', y: 'field_length / 2' },
      },
      {
        id: 'center_circle',
        type: 'circle',
        description: 'Center circle',
        center: { x: 'field_width / 2', y: 'field_length / 2' },
        radius: 9.15,
        radius_unit: 'meters_fixed',
      },
      {
        id: 'center_mark',
        type: 'point',
        description: 'Center spot',
        position: { x: 'field_width / 2', y: 'field_length / 2' },
        radius: 0.22,
      },
      {
        id: 'penalty_area_top',
        type: 'rectangle',
        description: 'Penalty area (top)',
        position: { x: '(field_width - 40.3) / 2', y: 0 },
        size: { width: 40.3, height: 16.5 },
        size_unit: 'meters_fixed',
      },
      {
        id: 'penalty_area_bottom',
        type: 'rectangle',
        description: 'Penalty area (bottom)',
        position: { x: '(field_width - 40.3) / 2', y: 'field_length - 16.5' },
        size: { width: 40.3, height: 16.5 },
        size_unit: 'meters_fixed',
      },
      {
        id: 'goal_area_top',
        type: 'rectangle',
        description: 'Goal area (top)',
        position: { x: '(field_width - 18.3) / 2', y: 0 },
        size: { width: 18.3, height: 5.5 },
        size_unit: 'meters_fixed',
      },
      {
        id: 'goal_area_bottom',
        type: 'rectangle',
        description: 'Goal area (bottom)',
        position: { x: '(field_width - 18.3) / 2', y: 'field_length - 5.5' },
        size: { width: 18.3, height: 5.5 },
        size_unit: 'meters_fixed',
      },
      {
        id: 'penalty_mark_top',
        type: 'point',
        description: 'Penalty spot (top)',
        position: { x: 'field_width / 2', y: 11 },
        radius: 0.22,
      },
      {
        id: 'penalty_mark_bottom',
        type: 'point',
        description: 'Penalty spot (bottom)',
        position: { x: 'field_width / 2', y: 'field_length - 11' },
        radius: 0.22,
      },
      {
        id: 'penalty_arc_top',
        type: 'arc',
        description: 'Penalty arc (top)',
        center: { x: 'field_width / 2', y: 11 },
        radius: 9.15,
        startAngle: 37,
        endAngle: 143,
      },
      {
        id: 'penalty_arc_bottom',
        type: 'arc',
        description: 'Penalty arc (bottom)',
        center: { x: 'field_width / 2', y: 'field_length - 11' },
        radius: 9.15,
        startAngle: 217,
        endAngle: 323,
      },
      {
        id: 'corner_arc_tl',
        type: 'arc',
        description: 'Corner arc (top-left)',
        center: { x: 0, y: 0 },
        radius: 1,
        quadrant: 'bottom-right',
      },
      {
        id: 'corner_arc_tr',
        type: 'arc',
        description: 'Corner arc (top-right)',
        center: { x: 'field_width', y: 0 },
        radius: 1,
        quadrant: 'bottom-left',
      },
      {
        id: 'corner_arc_bl',
        type: 'arc',
        description: 'Corner arc (bottom-left)',
        center: { x: 0, y: 'field_length' },
        radius: 1,
        quadrant: 'top-right',
      },
      {
        id: 'corner_arc_br',
        type: 'arc',
        description: 'Corner arc (bottom-right)',
        center: { x: 'field_width', y: 'field_length' },
        radius: 1,
        quadrant: 'top-left',
      },
    ],
    fixedElements: [
      'center_circle',
      'penalty_area_top',
      'penalty_area_bottom',
      'goal_area_top',
      'goal_area_bottom',
      'penalty_mark_top',
      'penalty_mark_bottom',
      'penalty_arc_top',
      'penalty_arc_bottom',
      'corner_arc_tl',
      'corner_arc_tr',
      'corner_arc_bl',
      'corner_arc_br',
    ],
    specifications: {
      centerCircleRadius: 9.15,
      penaltyAreaWidth: 40.3,
      penaltyAreaDepth: 16.5,
      goalAreaWidth: 18.3,
      goalAreaDepth: 5.5,
      penaltyMarkDistance: 11,
      penaltyArcRadius: 9.15,
      cornerArcRadius: 1,
      goalWidth: 7.32,
    },
  },
}

async function main() {
  console.log('Starting database seed...')

  // Check if template already exists
  const existingTemplate = await prisma.fieldTemplate.findFirst({
    where: {
      sport: 'soccer',
      name: '11v11 Full Field',
    },
  })

  if (existingTemplate) {
    console.log('Soccer 11v11 template already exists, updating...')
    await prisma.fieldTemplate.update({
      where: { id: existingTemplate.id },
      data: soccer11v11Template,
    })
    console.log('Template updated successfully')
  } else {
    console.log('Creating Soccer 11v11 template...')
    await prisma.fieldTemplate.create({
      data: soccer11v11Template,
    })
    console.log('Template created successfully')
  }

  console.log('Database seed completed!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
