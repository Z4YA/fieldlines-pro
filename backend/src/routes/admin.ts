import { Router, Response } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'
import { requireAdmin, requireSuperAdmin } from '../middleware/admin.js'
import { sendAdminInvitationEmail } from '../services/email.js'

const router = Router()

// All routes require authentication
router.use(authenticate)

// ============ DASHBOARD STATS ============

// GET /api/admin/stats - Get platform statistics
router.get('/stats', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      totalSportsgrounds,
      totalConfigurations,
      recentBookings
    ] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.booking.count({ where: { status: 'confirmed' } }),
      prisma.booking.count({ where: { status: 'completed' } }),
      prisma.sportsground.count(),
      prisma.fieldConfiguration.count(),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, email: true } },
          configuration: {
            include: {
              sportsground: { select: { name: true } },
              template: { select: { name: true } }
            }
          }
        }
      })
    ])

    res.json({
      users: { total: totalUsers },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings
      },
      sportsgrounds: { total: totalSportsgrounds },
      configurations: { total: totalConfigurations },
      recentBookings
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    res.status(500).json({ error: 'Failed to get statistics' })
  }
})

// ============ USER MANAGEMENT ============

// GET /api/admin/users - List all users with pagination/filtering
router.get('/users', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string
    const role = req.query.role as string

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { organization: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          organization: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              sportsgrounds: true,
              configurations: true,
              bookings: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get admin users error:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

// GET /api/admin/users/:id - Get user detail with their data
router.get('/users/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        organization: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        sportsgrounds: {
          select: {
            id: true,
            name: true,
            address: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        configurations: {
          select: {
            id: true,
            name: true,
            lengthMeters: true,
            widthMeters: true,
            lineColor: true,
            sportsground: { select: { name: true } },
            template: { select: { name: true } },
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        bookings: {
          select: {
            id: true,
            referenceNumber: true,
            preferredDate: true,
            preferredTime: true,
            status: true,
            createdAt: true,
            configuration: {
              select: {
                name: true,
                sportsground: { select: { name: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get admin user detail error:', error)
    res.status(500).json({ error: 'Failed to get user details' })
  }
})

// PUT /api/admin/users/:id/role - Update user role (super_admin only)
router.put('/users/:id/role', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    // Prevent changing own role
    if (id === req.userId) {
      return res.status(400).json({ error: 'Cannot change your own role' })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true
      }
    })

    res.json(user)
  } catch (error) {
    console.error('Update user role error:', error)
    res.status(500).json({ error: 'Failed to update user role' })
  }
})

// ============ BOOKING MANAGEMENT ============

// GET /api/admin/bookings - List all bookings with filters
router.get('/bookings', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const status = req.query.status as string
    const search = req.query.search as string

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { configuration: { name: { contains: search, mode: 'insensitive' } } },
        { configuration: { sportsground: { name: { contains: search, mode: 'insensitive' } } } }
      ]
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true }
          },
          configuration: {
            include: {
              sportsground: { select: { id: true, name: true, address: true } },
              template: { select: { id: true, name: true, sport: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.booking.count({ where })
    ])

    res.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get admin bookings error:', error)
    res.status(500).json({ error: 'Failed to get bookings' })
  }
})

// GET /api/admin/bookings/:id - Get booking detail
router.get('/bookings/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            organization: true
          }
        },
        configuration: {
          include: {
            sportsground: true,
            template: true
          }
        },
        bookingGroup: true
      }
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    res.json(booking)
  } catch (error) {
    console.error('Get admin booking detail error:', error)
    res.status(500).json({ error: 'Failed to get booking details' })
  }
})

// PUT /api/admin/bookings/:id/status - Update booking status
router.put('/bookings/:id/status', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { fullName: true, email: true } },
        configuration: {
          include: {
            sportsground: { select: { name: true } }
          }
        }
      }
    })

    // TODO: Send status update email to user

    res.json(booking)
  } catch (error) {
    console.error('Update booking status error:', error)
    res.status(500).json({ error: 'Failed to update booking status' })
  }
})

// ============ SPORTSGROUND MANAGEMENT ============

// GET /api/admin/sportsgrounds - List all sportsgrounds
router.get('/sportsgrounds', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [sportsgrounds, total] = await Promise.all([
      prisma.sportsground.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          _count: { select: { configurations: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.sportsground.count({ where })
    ])

    res.json({
      sportsgrounds,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get admin sportsgrounds error:', error)
    res.status(500).json({ error: 'Failed to get sportsgrounds' })
  }
})

// ============ CONFIGURATION MANAGEMENT ============

// GET /api/admin/configurations - List all configurations
router.get('/configurations', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sportsground: { name: { contains: search, mode: 'insensitive' } } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [configurations, total] = await Promise.all([
      prisma.fieldConfiguration.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          sportsground: { select: { id: true, name: true, address: true } },
          template: { select: { id: true, name: true, sport: true } },
          _count: { select: { bookings: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.fieldConfiguration.count({ where })
    ])

    res.json({
      configurations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get admin configurations error:', error)
    res.status(500).json({ error: 'Failed to get configurations' })
  }
})

// ============ FIELD TEMPLATE MANAGEMENT ============

const templateSchema = z.object({
  sport: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  minLength: z.number().positive(),
  maxLength: z.number().positive(),
  minWidth: z.number().positive(),
  maxWidth: z.number().positive(),
  defaultLength: z.number().positive(),
  defaultWidth: z.number().positive(),
  interiorElements: z.any(),
  isActive: z.boolean().optional()
})

// GET /api/admin/templates - List all templates (including inactive)
router.get('/templates', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.fieldTemplate.findMany({
      orderBy: [{ sport: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { configurations: true } }
      }
    })

    res.json(templates)
  } catch (error) {
    console.error('Get admin templates error:', error)
    res.status(500).json({ error: 'Failed to get templates' })
  }
})

// POST /api/admin/templates - Create new template
router.post('/templates', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = templateSchema.parse(req.body)

    const template = await prisma.fieldTemplate.create({
      data: {
        sport: data.sport,
        name: data.name,
        description: data.description,
        minLength: data.minLength,
        maxLength: data.maxLength,
        minWidth: data.minWidth,
        maxWidth: data.maxWidth,
        defaultLength: data.defaultLength,
        defaultWidth: data.defaultWidth,
        interiorElements: data.interiorElements,
        isActive: data.isActive ?? true
      }
    })

    res.status(201).json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Create template error:', error)
    res.status(500).json({ error: 'Failed to create template' })
  }
})

// PUT /api/admin/templates/:id - Update template
router.put('/templates/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const data = templateSchema.partial().parse(req.body)

    const template = await prisma.fieldTemplate.update({
      where: { id },
      data
    })

    res.json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Update template error:', error)
    res.status(500).json({ error: 'Failed to update template' })
  }
})

// DELETE /api/admin/templates/:id - Soft delete template
router.delete('/templates/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Soft delete - just set isActive to false
    const template = await prisma.fieldTemplate.update({
      where: { id },
      data: { isActive: false }
    })

    res.json(template)
  } catch (error) {
    console.error('Delete template error:', error)
    res.status(500).json({ error: 'Failed to delete template' })
  }
})

// ============ ADMIN INVITATION MANAGEMENT ============

const invitationSchema = z.object({
  email: z.string().email()
})

// GET /api/admin/invitations - List all invitations
router.get('/invitations', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const invitations = await prisma.adminInvitation.findMany({
      include: {
        invitedBy: { select: { fullName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(invitations)
  } catch (error) {
    console.error('Get invitations error:', error)
    res.status(500).json({ error: 'Failed to get invitations' })
  }
})

// POST /api/admin/invitations - Create admin invitation
router.post('/invitations', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = invitationSchema.parse(req.body)

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' })
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.adminInvitation.findUnique({
      where: { email: data.email }
    })

    if (existingInvitation && !existingInvitation.acceptedAt) {
      return res.status(400).json({ error: 'An invitation for this email already exists' })
    }

    // Create invitation token
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Get inviter name for email
    const inviter = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { fullName: true }
    })

    // Create or update invitation
    const invitation = await prisma.adminInvitation.upsert({
      where: { email: data.email },
      update: {
        token,
        expiresAt,
        invitedById: req.userId!,
        acceptedAt: null
      },
      create: {
        email: data.email,
        token,
        expiresAt,
        invitedById: req.userId!
      }
    })

    // Send invitation email
    await sendAdminInvitationEmail(data.email, token, inviter?.fullName || 'Admin')

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Create invitation error:', error)
    res.status(500).json({ error: 'Failed to create invitation' })
  }
})

// DELETE /api/admin/invitations/:id - Cancel/delete invitation
router.delete('/invitations/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    await prisma.adminInvitation.delete({
      where: { id }
    })

    res.json({ message: 'Invitation deleted' })
  } catch (error) {
    console.error('Delete invitation error:', error)
    res.status(500).json({ error: 'Failed to delete invitation' })
  }
})

export default router
