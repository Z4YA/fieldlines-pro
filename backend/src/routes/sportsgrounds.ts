import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Validation schemas
const createSportsgroundSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  defaultZoom: z.number().min(1).max(22).optional(),
  notes: z.string().optional(),
})

const updateSportsgroundSchema = createSportsgroundSchema.partial()

// GET /api/sportsgrounds - List user's sportsgrounds
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const sportsgrounds = await prisma.sportsground.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
    })

    res.json(sportsgrounds)
  } catch (error) {
    console.error('List sportsgrounds error:', error)
    res.status(500).json({ error: 'Failed to list sportsgrounds' })
  }
})

// POST /api/sportsgrounds - Create new sportsground
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = createSportsgroundSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      })
    }

    const { name, address, latitude, longitude, defaultZoom, notes } = validation.data

    const sportsground = await prisma.sportsground.create({
      data: {
        userId: req.userId!,
        name,
        address,
        latitude,
        longitude,
        defaultZoom: defaultZoom || 18,
        notes,
      },
    })

    res.status(201).json(sportsground)
  } catch (error) {
    console.error('Create sportsground error:', error)
    res.status(500).json({ error: 'Failed to create sportsground' })
  }
})

// GET /api/sportsgrounds/:id - Get sportsground details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const sportsground = await prisma.sportsground.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        configurations: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    })

    if (!sportsground) {
      return res.status(404).json({ error: 'Sportsground not found' })
    }

    res.json(sportsground)
  } catch (error) {
    console.error('Get sportsground error:', error)
    res.status(500).json({ error: 'Failed to get sportsground' })
  }
})

// PUT /api/sportsgrounds/:id - Update sportsground
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const validation = updateSportsgroundSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      })
    }

    // Check ownership
    const existing = await prisma.sportsground.findFirst({
      where: { id, userId: req.userId },
    })

    if (!existing) {
      return res.status(404).json({ error: 'Sportsground not found' })
    }

    const sportsground = await prisma.sportsground.update({
      where: { id },
      data: validation.data,
    })

    res.json(sportsground)
  } catch (error) {
    console.error('Update sportsground error:', error)
    res.status(500).json({ error: 'Failed to update sportsground' })
  }
})

// DELETE /api/sportsgrounds/:id - Delete sportsground
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Check ownership
    const existing = await prisma.sportsground.findFirst({
      where: { id, userId: req.userId },
    })

    if (!existing) {
      return res.status(404).json({ error: 'Sportsground not found' })
    }

    await prisma.sportsground.delete({ where: { id } })

    res.json({ message: 'Sportsground deleted successfully' })
  } catch (error) {
    console.error('Delete sportsground error:', error)
    res.status(500).json({ error: 'Failed to delete sportsground' })
  }
})

export default router
