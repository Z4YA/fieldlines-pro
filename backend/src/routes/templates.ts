import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'

const router = Router()

// GET /api/templates - List all available templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = await prisma.fieldTemplate.findMany({
      where: { isActive: true },
      orderBy: [
        { sport: 'asc' },
        { name: 'asc' },
      ],
    })

    res.json(templates)
  } catch (error) {
    console.error('List templates error:', error)
    res.status(500).json({ error: 'Failed to list templates' })
  }
})

// GET /api/templates/:id - Get template details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const template = await prisma.fieldTemplate.findFirst({
      where: {
        id,
        isActive: true,
      },
    })

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json(template)
  } catch (error) {
    console.error('Get template error:', error)
    res.status(500).json({ error: 'Failed to get template' })
  }
})

export default router
