import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Validation schema for updating settings
const updateSettingSchema = z.object({
  value: z.string().min(1, 'Value is required'),
})

// GET /api/settings - Get all settings (admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.systemSettings.findMany({
      orderBy: { key: 'asc' },
    })

    // Convert to key-value object for easier frontend consumption
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>)

    res.json(settingsObject)
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ error: 'Failed to get settings' })
  }
})

// GET /api/settings/:key - Get specific setting (admin only)
router.get('/:key', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params

    const setting = await prisma.systemSettings.findUnique({
      where: { key },
    })

    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' })
    }

    res.json({ key: setting.key, value: setting.value })
  } catch (error) {
    console.error('Get setting error:', error)
    res.status(500).json({ error: 'Failed to get setting' })
  }
})

// PUT /api/settings/:key - Update or create setting (admin only)
router.put('/:key', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params
    const validation = updateSettingSchema.safeParse(req.body)

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      })
    }

    const { value } = validation.data

    // Upsert the setting
    const setting = await prisma.systemSettings.upsert({
      where: { key },
      update: {
        value,
        updatedBy: req.userId,
      },
      create: {
        key,
        value,
        updatedBy: req.userId,
      },
    })

    res.json({ key: setting.key, value: setting.value })
  } catch (error) {
    console.error('Update setting error:', error)
    res.status(500).json({ error: 'Failed to update setting' })
  }
})

// Helper function to get a setting value (for internal use)
export async function getSettingValue(key: string, defaultValue: string): Promise<string> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key },
    })
    return setting?.value ?? defaultValue
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error)
    return defaultValue
  }
}

export default router
