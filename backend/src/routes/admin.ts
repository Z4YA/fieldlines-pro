import { Router, Response } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'
import { requireAdmin, requireSuperAdmin } from '../middleware/admin.js'
import { sendAdminInvitationEmail, sendUserInvitationEmail, sendVerificationEmail, sendPasswordResetEmail } from '../services/email.js'

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
          suspended: true,
          suspendedAt: true,
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

// PUT /api/admin/users/:id/role - Update user role (admin or super_admin)
router.put('/users/:id/role', requireAdmin, async (req: AuthRequest, res: Response) => {
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

    // Get current user's role
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    })

    // Get target user's current role
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    })

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isSuperAdmin = currentUser?.role === 'super_admin'

    // Regular admins can only modify regular users
    if (!isSuperAdmin) {
      // Cannot modify admins or super_admins
      if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
        return res.status(403).json({ error: 'You can only modify regular users' })
      }
      // Cannot promote to admin or super_admin
      if (role === 'admin' || role === 'super_admin') {
        return res.status(403).json({ error: 'You cannot promote users to admin roles' })
      }
    }

    // Super admins cannot modify other super admins
    if (isSuperAdmin && targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot modify other super admin accounts' })
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

// PUT /api/admin/users/:id/suspend - Suspend or unsuspend a user
router.put('/users/:id/suspend', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { suspended } = req.body

    if (typeof suspended !== 'boolean') {
      return res.status(400).json({ error: 'suspended must be a boolean' })
    }

    // Cannot suspend yourself
    if (id === req.userId) {
      return res.status(400).json({ error: 'Cannot suspend your own account' })
    }

    // Get current user's role
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    })

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    })

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isSuperAdmin = currentUser?.role === 'super_admin'

    // Regular admins can only suspend regular users
    if (!isSuperAdmin && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) {
      return res.status(403).json({ error: 'You can only suspend regular users' })
    }

    // Super admins cannot suspend other super admins
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot suspend super admin accounts' })
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        suspended,
        suspendedAt: suspended ? new Date() : null
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        suspended: true,
        suspendedAt: true
      }
    })

    res.json(user)
  } catch (error) {
    console.error('Suspend user error:', error)
    res.status(500).json({ error: 'Failed to update user suspension status' })
  }
})

// POST /api/admin/users/:id/reset-password - Send password reset email to user
router.post('/users/:id/reset-password', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, role: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get current user's role
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    })

    const isSuperAdmin = currentUser?.role === 'super_admin'

    // Regular admins can only reset passwords for regular users
    if (!isSuperAdmin && (user.role === 'admin' || user.role === 'super_admin')) {
      return res.status(403).json({ error: 'You can only reset passwords for regular users' })
    }

    // Generate reset token
    const resetToken = uuidv4()
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.user.update({
      where: { id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken)

    res.json({ message: 'Password reset email sent successfully' })
  } catch (error) {
    console.error('Admin reset password error:', error)
    res.status(500).json({ error: 'Failed to send password reset email' })
  }
})

// POST /api/admin/users/:id/resend-verification - Resend verification email
router.post('/users/:id/resend-verification', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, emailVerified: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'User email is already verified' })
    }

    // Generate new verification token
    const verificationToken = uuidv4()

    await prisma.user.update({
      where: { id },
      data: { verificationToken }
    })

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken)

    res.json({ message: 'Verification email sent successfully' })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({ error: 'Failed to send verification email' })
  }
})

// DELETE /api/admin/users/:id - Delete a user and all their data
router.delete('/users/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Cannot delete yourself
    if (id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    // Get current user's role
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    })

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true, fullName: true, email: true }
    })

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isSuperAdmin = currentUser?.role === 'super_admin'

    // Regular admins can only delete regular users
    if (!isSuperAdmin && (targetUser.role === 'admin' || targetUser.role === 'super_admin')) {
      return res.status(403).json({ error: 'You can only delete regular users' })
    }

    // Cannot delete super admins
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot delete super admin accounts' })
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    })

    res.json({ message: 'User deleted successfully', user: { id, fullName: targetUser.fullName, email: targetUser.email } })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Failed to delete user' })
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

// GET /api/admin/sportsgrounds/:id - Get single sportsground with details
router.get('/sportsgrounds/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const sportsground = await prisma.sportsground.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        configurations: {
          include: {
            template: { select: { id: true, name: true, sport: true } }
          }
        }
      }
    })

    if (!sportsground) {
      return res.status(404).json({ error: 'Sportsground not found' })
    }

    res.json(sportsground)
  } catch (error) {
    console.error('Get admin sportsground error:', error)
    res.status(500).json({ error: 'Failed to get sportsground' })
  }
})

const adminSportsgroundSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  defaultZoom: z.number().min(1).max(22).optional(),
  notes: z.string().optional()
})

// POST /api/admin/sportsgrounds - Create sportsground for a user
router.post('/sportsgrounds', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = adminSportsgroundSchema.parse(req.body)

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: data.userId } })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const sportsground = await prisma.sportsground.create({
      data: {
        userId: data.userId,
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        defaultZoom: data.defaultZoom || 18,
        notes: data.notes
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        _count: { select: { configurations: true } }
      }
    })

    res.status(201).json(sportsground)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    console.error('Create admin sportsground error:', error)
    res.status(500).json({ error: 'Failed to create sportsground' })
  }
})

const adminSportsgroundUpdateSchema = z.object({
  userId: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  defaultZoom: z.number().min(1).max(22).optional(),
  notes: z.string().optional()
})

// PUT /api/admin/sportsgrounds/:id - Update sportsground (including ownership transfer)
router.put('/sportsgrounds/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const data = adminSportsgroundUpdateSchema.parse(req.body)

    // Verify sportsground exists
    const existing = await prisma.sportsground.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ error: 'Sportsground not found' })
    }

    // If transferring ownership, verify new user exists
    if (data.userId && data.userId !== existing.userId) {
      const newUser = await prisma.user.findUnique({ where: { id: data.userId } })
      if (!newUser) {
        return res.status(404).json({ error: 'New owner user not found' })
      }

      // Also transfer all configurations on this sportsground to the new owner
      await prisma.fieldConfiguration.updateMany({
        where: { sportsgroundId: id },
        data: { userId: data.userId }
      })
    }

    const sportsground = await prisma.sportsground.update({
      where: { id },
      data: {
        userId: data.userId,
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        defaultZoom: data.defaultZoom,
        notes: data.notes
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        _count: { select: { configurations: true } }
      }
    })

    res.json(sportsground)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    console.error('Update admin sportsground error:', error)
    res.status(500).json({ error: 'Failed to update sportsground' })
  }
})

// DELETE /api/admin/sportsgrounds/:id - Delete sportsground
router.delete('/sportsgrounds/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Verify sportsground exists
    const existing = await prisma.sportsground.findUnique({
      where: { id },
      include: { _count: { select: { configurations: true } } }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Sportsground not found' })
    }

    // Delete sportsground (configurations will cascade delete)
    await prisma.sportsground.delete({ where: { id } })

    res.json({ message: 'Sportsground deleted successfully' })
  } catch (error) {
    console.error('Delete admin sportsground error:', error)
    res.status(500).json({ error: 'Failed to delete sportsground' })
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

// GET /api/admin/configurations/:id - Get single configuration with details
router.get('/configurations/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const configuration = await prisma.fieldConfiguration.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        sportsground: { select: { id: true, name: true, address: true, userId: true } },
        template: true,
        _count: { select: { bookings: true } }
      }
    })

    if (!configuration) {
      return res.status(404).json({ error: 'Configuration not found' })
    }

    res.json(configuration)
  } catch (error) {
    console.error('Get admin configuration error:', error)
    res.status(500).json({ error: 'Failed to get configuration' })
  }
})

const adminConfigurationSchema = z.object({
  userId: z.string().uuid(),
  sportsgroundId: z.string().uuid(),
  templateId: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  rotationDegrees: z.number().min(0).max(360).default(0),
  lengthMeters: z.number().positive(),
  widthMeters: z.number().positive(),
  lineColor: z.string().optional()
})

// POST /api/admin/configurations - Create configuration for a user
router.post('/configurations', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = adminConfigurationSchema.parse(req.body)

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: data.userId } })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify sportsground exists
    const sportsground = await prisma.sportsground.findUnique({ where: { id: data.sportsgroundId } })
    if (!sportsground) {
      return res.status(404).json({ error: 'Sportsground not found' })
    }

    // Verify template exists and is active
    const template = await prisma.fieldTemplate.findUnique({ where: { id: data.templateId } })
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }
    if (!template.isActive) {
      return res.status(400).json({ error: 'Template is not active' })
    }

    // Validate dimensions against template constraints
    if (data.lengthMeters < template.minLength || data.lengthMeters > template.maxLength) {
      return res.status(400).json({
        error: `Length must be between ${template.minLength}m and ${template.maxLength}m`
      })
    }
    if (data.widthMeters < template.minWidth || data.widthMeters > template.maxWidth) {
      return res.status(400).json({
        error: `Width must be between ${template.minWidth}m and ${template.maxWidth}m`
      })
    }

    const configuration = await prisma.fieldConfiguration.create({
      data: {
        userId: data.userId,
        sportsgroundId: data.sportsgroundId,
        templateId: data.templateId,
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        rotationDegrees: data.rotationDegrees,
        lengthMeters: data.lengthMeters,
        widthMeters: data.widthMeters,
        lineColor: data.lineColor || '#FFFFFF'
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        sportsground: { select: { id: true, name: true, address: true } },
        template: { select: { id: true, name: true, sport: true } },
        _count: { select: { bookings: true } }
      }
    })

    res.status(201).json(configuration)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    console.error('Create admin configuration error:', error)
    res.status(500).json({ error: 'Failed to create configuration' })
  }
})

const adminConfigurationUpdateSchema = z.object({
  userId: z.string().uuid().optional(),
  sportsgroundId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  rotationDegrees: z.number().min(0).max(360).optional(),
  lengthMeters: z.number().positive().optional(),
  widthMeters: z.number().positive().optional(),
  lineColor: z.string().optional()
})

// PUT /api/admin/configurations/:id - Update configuration (including ownership transfer)
router.put('/configurations/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const data = adminConfigurationUpdateSchema.parse(req.body)

    // Verify configuration exists
    const existing = await prisma.fieldConfiguration.findUnique({
      where: { id },
      include: { template: true, user: { select: { id: true } } }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Configuration not found' })
    }

    // If transferring ownership, verify new user exists and owns the sportsground
    if (data.userId && data.userId !== existing.user.id) {
      const newUser = await prisma.user.findUnique({ where: { id: data.userId } })
      if (!newUser) {
        console.error('User not found for transfer:', { providedUserId: data.userId, existingUserId: existing.user.id })
        return res.status(404).json({ error: 'New owner user not found' })
      }

      // Check if new user owns the sportsground this configuration is on
      const sportsground = await prisma.sportsground.findUnique({
        where: { id: existing.sportsgroundId },
        select: { userId: true }
      })
      if (sportsground && sportsground.userId !== data.userId) {
        return res.status(400).json({
          error: 'Cannot transfer configuration to a user who does not own the sportsground. Transfer the sportsground first.'
        })
      }
    }

    // If changing sportsground, verify it exists
    if (data.sportsgroundId && data.sportsgroundId !== existing.sportsgroundId) {
      const sportsground = await prisma.sportsground.findUnique({ where: { id: data.sportsgroundId } })
      if (!sportsground) {
        return res.status(404).json({ error: 'Sportsground not found' })
      }
    }

    // If changing template, verify it exists and is active
    let template = existing.template
    if (data.templateId && data.templateId !== existing.templateId) {
      const newTemplate = await prisma.fieldTemplate.findUnique({ where: { id: data.templateId } })
      if (!newTemplate) {
        return res.status(404).json({ error: 'Template not found' })
      }
      if (!newTemplate.isActive) {
        return res.status(400).json({ error: 'Template is not active' })
      }
      template = newTemplate
    }

    // Validate dimensions if provided
    if (data.lengthMeters !== undefined) {
      if (data.lengthMeters < template.minLength || data.lengthMeters > template.maxLength) {
        return res.status(400).json({
          error: `Length must be between ${template.minLength}m and ${template.maxLength}m`
        })
      }
    }
    if (data.widthMeters !== undefined) {
      if (data.widthMeters < template.minWidth || data.widthMeters > template.maxWidth) {
        return res.status(400).json({
          error: `Width must be between ${template.minWidth}m and ${template.maxWidth}m`
        })
      }
    }

    const configuration = await prisma.fieldConfiguration.update({
      where: { id },
      data: {
        userId: data.userId,
        sportsgroundId: data.sportsgroundId,
        templateId: data.templateId,
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        rotationDegrees: data.rotationDegrees,
        lengthMeters: data.lengthMeters,
        widthMeters: data.widthMeters,
        lineColor: data.lineColor
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        sportsground: { select: { id: true, name: true, address: true } },
        template: { select: { id: true, name: true, sport: true } },
        _count: { select: { bookings: true } }
      }
    })

    res.json(configuration)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    console.error('Update admin configuration error:', error)
    res.status(500).json({ error: 'Failed to update configuration' })
  }
})

// DELETE /api/admin/configurations/:id - Delete configuration
router.delete('/configurations/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Verify configuration exists
    const existing = await prisma.fieldConfiguration.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Configuration not found' })
    }

    // Delete configuration (bookings will cascade delete)
    await prisma.fieldConfiguration.delete({ where: { id } })

    res.json({ message: 'Configuration deleted successfully' })
  } catch (error) {
    console.error('Delete admin configuration error:', error)
    res.status(500).json({ error: 'Failed to delete configuration' })
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

    // Normalize email to lowercase
    const normalizedEmail = data.email.toLowerCase().trim()

    // Check if email is already registered (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' }
      }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' })
    }

    // Check if invitation already exists (case-insensitive)
    const existingInvitation = await prisma.adminInvitation.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' }
      }
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

    // Create or update invitation (use normalized email)
    const invitation = await prisma.adminInvitation.upsert({
      where: { email: normalizedEmail },
      update: {
        token,
        expiresAt,
        invitedById: req.userId!,
        acceptedAt: null
      },
      create: {
        email: normalizedEmail,
        token,
        expiresAt,
        invitedById: req.userId!
      }
    })

    // Send invitation email
    await sendAdminInvitationEmail(normalizedEmail, token, inviter?.fullName || 'Admin')

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

// ============ USER INVITATION MANAGEMENT ============

// GET /api/admin/user-invitations - List all user invitations
router.get('/user-invitations', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const invitations = await prisma.userInvitation.findMany({
      include: {
        invitedBy: { select: { fullName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(invitations)
  } catch (error) {
    console.error('Get user invitations error:', error)
    res.status(500).json({ error: 'Failed to get invitations' })
  }
})

// POST /api/admin/user-invitations - Create user invitation
router.post('/user-invitations', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = invitationSchema.parse(req.body)

    // Normalize email to lowercase
    const normalizedEmail = data.email.toLowerCase().trim()

    // Check if email is already registered (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' }
      }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' })
    }

    // Check if user invitation already exists (case-insensitive)
    const existingUserInvitation = await prisma.userInvitation.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' }
      }
    })

    if (existingUserInvitation && !existingUserInvitation.acceptedAt) {
      return res.status(400).json({ error: 'An invitation for this email already exists' })
    }

    // Check if admin invitation already exists (case-insensitive)
    const existingAdminInvitation = await prisma.adminInvitation.findFirst({
      where: {
        email: { equals: normalizedEmail, mode: 'insensitive' }
      }
    })

    if (existingAdminInvitation && !existingAdminInvitation.acceptedAt) {
      return res.status(400).json({ error: 'An admin invitation for this email already exists' })
    }

    // Create invitation token
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Get inviter name for email
    const inviter = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { fullName: true }
    })

    // Create or update invitation (use normalized email)
    const invitation = await prisma.userInvitation.upsert({
      where: { email: normalizedEmail },
      update: {
        token,
        expiresAt,
        invitedById: req.userId!,
        acceptedAt: null
      },
      create: {
        email: normalizedEmail,
        token,
        expiresAt,
        invitedById: req.userId!
      }
    })

    // Send invitation email
    await sendUserInvitationEmail(normalizedEmail, token, inviter?.fullName || 'Admin')

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
    console.error('Create user invitation error:', error)
    res.status(500).json({ error: 'Failed to create invitation' })
  }
})

// DELETE /api/admin/user-invitations/:id - Cancel/delete user invitation
router.delete('/user-invitations/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    await prisma.userInvitation.delete({
      where: { id }
    })

    res.json({ message: 'Invitation deleted' })
  } catch (error) {
    console.error('Delete user invitation error:', error)
    res.status(500).json({ error: 'Failed to delete invitation' })
  }
})

export default router
