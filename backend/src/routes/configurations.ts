import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Validation schemas
const createConfigurationSchema = z.object({
  sportsgroundId: z.string().uuid('Invalid sportsground ID'),
  templateId: z.string().uuid('Invalid template ID'),
  name: z.string().min(1, 'Name is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  rotationDegrees: z.number().min(0).max(360),
  lengthMeters: z.number().positive('Length must be positive'),
  widthMeters: z.number().positive('Width must be positive'),
  lineColor: z.string().min(1, 'Line color is required'),
})

const updateConfigurationSchema = createConfigurationSchema.partial().omit({
  sportsgroundId: true,
  templateId: true,
})

// GET /api/configurations - List user's configurations
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sportsgroundId } = req.query

    const whereClause: { userId: string; sportsgroundId?: string } = {
      userId: req.userId!,
    }

    if (sportsgroundId && typeof sportsgroundId === 'string') {
      whereClause.sportsgroundId = sportsgroundId
    }

    const configurations = await prisma.fieldConfiguration.findMany({
      where: whereClause,
      include: {
        sportsground: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            sport: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    res.json(configurations)
  } catch (error) {
    console.error('List configurations error:', error)
    res.status(500).json({ error: 'Failed to list configurations' })
  }
})

// POST /api/configurations - Create new configuration
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = createConfigurationSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      })
    }

    const data = validation.data

    // Verify sportsground ownership
    const sportsground = await prisma.sportsground.findFirst({
      where: {
        id: data.sportsgroundId,
        userId: req.userId,
      },
    })

    if (!sportsground) {
      return res.status(404).json({ error: 'Sportsground not found' })
    }

    // Verify template exists
    const template = await prisma.fieldTemplate.findFirst({
      where: {
        id: data.templateId,
        isActive: true,
      },
    })

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    const configuration = await prisma.fieldConfiguration.create({
      data: {
        ...data,
        userId: req.userId!,
      },
      include: {
        sportsground: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            sport: true,
          },
        },
      },
    })

    res.status(201).json(configuration)
  } catch (error) {
    console.error('Create configuration error:', error)
    res.status(500).json({ error: 'Failed to create configuration' })
  }
})

// GET /api/configurations/:id - Get configuration details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const configuration = await prisma.fieldConfiguration.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        sportsground: true,
        template: true,
      },
    })

    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' })
    }

    res.json(configuration)
  } catch (error) {
    console.error('Get configuration error:', error)
    res.status(500).json({ error: 'Failed to get configuration' })
  }
})

// PUT /api/configurations/:id - Update configuration
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const validation = updateConfigurationSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      })
    }

    // Check ownership
    const existing = await prisma.fieldConfiguration.findFirst({
      where: { id, userId: req.userId },
    })

    if (!existing) {
      return res.status(404).json({ error: 'Configuration not found' })
    }

    const configuration = await prisma.fieldConfiguration.update({
      where: { id },
      data: validation.data,
      include: {
        sportsground: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            sport: true,
          },
        },
      },
    })

    res.json(configuration)
  } catch (error) {
    console.error('Update configuration error:', error)
    res.status(500).json({ error: 'Failed to update configuration' })
  }
})

// DELETE /api/configurations/:id - Delete configuration
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Check ownership
    const existing = await prisma.fieldConfiguration.findFirst({
      where: { id, userId: req.userId },
    })

    if (!existing) {
      return res.status(404).json({ error: 'Configuration not found' })
    }

    await prisma.fieldConfiguration.delete({ where: { id } })

    res.json({ message: 'Configuration deleted successfully' })
  } catch (error) {
    console.error('Delete configuration error:', error)
    res.status(500).json({ error: 'Failed to delete configuration' })
  }
})

// POST /api/configurations/:id/duplicate - Duplicate configuration
router.post('/:id/duplicate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name } = req.body

    // Get original configuration
    const original = await prisma.fieldConfiguration.findFirst({
      where: { id, userId: req.userId },
    })

    if (!original) {
      return res.status(404).json({ error: 'Configuration not found' })
    }

    // Create duplicate
    const configuration = await prisma.fieldConfiguration.create({
      data: {
        userId: req.userId!,
        sportsgroundId: original.sportsgroundId,
        templateId: original.templateId,
        name: name || `${original.name} (Copy)`,
        latitude: original.latitude,
        longitude: original.longitude,
        rotationDegrees: original.rotationDegrees,
        lengthMeters: original.lengthMeters,
        widthMeters: original.widthMeters,
        lineColor: original.lineColor,
      },
      include: {
        sportsground: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            sport: true,
          },
        },
      },
    })

    res.status(201).json(configuration)
  } catch (error) {
    console.error('Duplicate configuration error:', error)
    res.status(500).json({ error: 'Failed to duplicate configuration' })
  }
})

export default router
