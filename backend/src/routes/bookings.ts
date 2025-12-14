import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'
import { sendBookingConfirmationEmail, sendProviderNotificationEmail } from '../services/email.js'

const router = Router()

// Generate booking reference number
function generateReferenceNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `BK-${year}-${random}`
}

// Generate group reference number
function generateGroupReferenceNumber(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `BKG-${year}-${random}`
}

// Validation schemas
const createBookingSchema = z.object({
  configurationId: z.string().uuid('Invalid configuration ID'),
  preferredDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  preferredTime: z.string().min(1, 'Preferred time is required'),
  alternativeDate: z.string().refine((date) => !date || !isNaN(Date.parse(date)), {
    message: 'Invalid alternative date format',
  }).optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  contactPreference: z.enum(['phone', 'email']),
})

const updateBookingSchema = z.object({
  preferredDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }).optional(),
  preferredTime: z.string().min(1).optional(),
  alternativeDate: z.string().refine((date) => !date || !isNaN(Date.parse(date)), {
    message: 'Invalid alternative date format',
  }).optional(),
  notes: z.string().max(500).optional(),
  contactPreference: z.enum(['phone', 'email']).optional(),
})

const createBatchBookingSchema = z.object({
  sportsgroundId: z.string().uuid('Invalid sportsground ID'),
  configurations: z.array(z.object({
    configurationId: z.string().uuid('Invalid configuration ID'),
    preferredDate: z.string().refine((date) => !date || !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    }).optional(),
    preferredTime: z.string().optional(),
  })).min(1, 'At least one configuration is required').max(20, 'Maximum 20 configurations per batch'),
  defaultPreferredDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid default date format',
  }),
  defaultPreferredTime: z.string().min(1, 'Default preferred time is required'),
  alternativeDate: z.string().refine((date) => !date || !isNaN(Date.parse(date)), {
    message: 'Invalid alternative date format',
  }).optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  contactPreference: z.enum(['phone', 'email', 'both']),
})

// GET /api/bookings - List user's bookings
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query

    const whereClause: { userId: string; status?: string } = {
      userId: req.userId!,
    }

    if (status && typeof status === 'string') {
      whereClause.status = status
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        configuration: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(bookings)
  } catch (error) {
    console.error('List bookings error:', error)
    res.status(500).json({ error: 'Failed to list bookings' })
  }
})

// POST /api/bookings - Create new booking
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = createBookingSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      })
    }

    const data = validation.data

    // Verify configuration ownership
    const configuration = await prisma.fieldConfiguration.findFirst({
      where: {
        id: data.configurationId,
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

    // Get user details for email
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Generate unique reference number
    let referenceNumber = generateReferenceNumber()
    let attempts = 0
    while (await prisma.booking.findUnique({ where: { referenceNumber } })) {
      referenceNumber = generateReferenceNumber()
      attempts++
      if (attempts > 10) {
        return res.status(500).json({ error: 'Failed to generate booking reference' })
      }
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.userId!,
        configurationId: data.configurationId,
        referenceNumber,
        preferredDate: new Date(data.preferredDate),
        preferredTime: data.preferredTime,
        alternativeDate: data.alternativeDate ? new Date(data.alternativeDate) : null,
        notes: data.notes,
        contactPreference: data.contactPreference,
        status: 'pending',
      },
      include: {
        configuration: {
          include: {
            sportsground: true,
            template: true,
          },
        },
      },
    })

    // Send confirmation email to customer
    await sendBookingConfirmationEmail({
      to: user.email,
      referenceNumber: booking.referenceNumber,
      customerName: user.fullName,
      sportsgroundName: configuration.sportsground.name,
      sportsgroundAddress: configuration.sportsground.address,
      templateName: configuration.template.name,
      dimensions: `${configuration.lengthMeters}m x ${configuration.widthMeters}m`,
      lineColor: configuration.lineColor,
      preferredDate: booking.preferredDate.toLocaleDateString(),
      preferredTime: booking.preferredTime,
    })

    // Send notification email to provider
    await sendProviderNotificationEmail({
      referenceNumber: booking.referenceNumber,
      customerName: user.fullName,
      customerEmail: user.email,
      customerPhone: user.phone,
      customerOrganization: user.organization,
      sportsgroundName: configuration.sportsground.name,
      sportsgroundAddress: configuration.sportsground.address,
      latitude: configuration.latitude,
      longitude: configuration.longitude,
      templateName: configuration.template.name,
      dimensions: `${configuration.lengthMeters}m x ${configuration.widthMeters}m`,
      rotation: configuration.rotationDegrees,
      lineColor: configuration.lineColor,
      preferredDate: booking.preferredDate.toLocaleDateString(),
      preferredTime: booking.preferredTime,
      alternativeDate: booking.alternativeDate?.toLocaleDateString(),
      notes: booking.notes,
      contactPreference: booking.contactPreference,
    })

    res.status(201).json(booking)
  } catch (error) {
    console.error('Create booking error:', error)
    res.status(500).json({ error: 'Failed to create booking' })
  }
})

// GET /api/bookings/:id - Get booking details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        configuration: {
          include: {
            sportsground: true,
            template: true,
          },
        },
      },
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    res.json(booking)
  } catch (error) {
    console.error('Get booking error:', error)
    res.status(500).json({ error: 'Failed to get booking' })
  }
})

// PUT /api/bookings/:id - Update booking
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const validation = updateBookingSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors
      })
    }

    // Check ownership and status
    const existing = await prisma.booking.findFirst({
      where: { id, userId: req.userId },
    })

    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (existing.status !== 'pending') {
      return res.status(400).json({
        error: 'Only pending bookings can be modified'
      })
    }

    const updateData: Record<string, unknown> = {}
    if (validation.data.preferredDate) {
      updateData.preferredDate = new Date(validation.data.preferredDate)
    }
    if (validation.data.preferredTime) {
      updateData.preferredTime = validation.data.preferredTime
    }
    if (validation.data.alternativeDate !== undefined) {
      updateData.alternativeDate = validation.data.alternativeDate
        ? new Date(validation.data.alternativeDate)
        : null
    }
    if (validation.data.notes !== undefined) {
      updateData.notes = validation.data.notes
    }
    if (validation.data.contactPreference) {
      updateData.contactPreference = validation.data.contactPreference
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        configuration: {
          include: {
            sportsground: true,
            template: true,
          },
        },
      },
    })

    res.json(booking)
  } catch (error) {
    console.error('Update booking error:', error)
    res.status(500).json({ error: 'Failed to update booking' })
  }
})

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Check ownership
    const existing = await prisma.booking.findFirst({
      where: { id, userId: req.userId },
    })

    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Check if cancellation is allowed (48 hours before preferred date)
    const now = new Date()
    const hoursUntilBooking = (existing.preferredDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (existing.status !== 'pending') {
      return res.status(400).json({
        error: 'Only pending bookings can be cancelled'
      })
    }

    if (hoursUntilBooking < 48) {
      return res.status(400).json({
        error: 'Bookings must be cancelled at least 48 hours before the preferred date'
      })
    }

    // Update status to cancelled instead of deleting
    await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    })

    res.json({ message: 'Booking cancelled successfully' })
  } catch (error) {
    console.error('Cancel booking error:', error)
    res.status(500).json({ error: 'Failed to cancel booking' })
  }
})

// POST /api/bookings/batch - Create batch booking (multiple configurations)
router.post('/batch', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = createBatchBookingSchema.safeParse(req.body)
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

    // Get user details for email
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify all configurations belong to this sportsground and user
    const configurationIds = data.configurations.map(c => c.configurationId)
    const configurations = await prisma.fieldConfiguration.findMany({
      where: {
        id: { in: configurationIds },
        userId: req.userId,
        sportsgroundId: data.sportsgroundId,
      },
      include: {
        template: true,
        sportsground: true,
      },
    })

    if (configurations.length !== configurationIds.length) {
      return res.status(400).json({
        error: 'One or more configurations are invalid or do not belong to the specified sportsground'
      })
    }

    // Generate unique group reference number
    let groupReferenceNumber = generateGroupReferenceNumber()
    let attempts = 0
    while (await prisma.bookingGroup.findUnique({ where: { groupReferenceNumber } })) {
      groupReferenceNumber = generateGroupReferenceNumber()
      attempts++
      if (attempts > 10) {
        return res.status(500).json({ error: 'Failed to generate group reference' })
      }
    }

    // Create booking group and bookings in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the booking group
      const bookingGroup = await tx.bookingGroup.create({
        data: {
          userId: req.userId!,
          sportsgroundId: data.sportsgroundId,
          groupReferenceNumber,
          defaultPreferredDate: new Date(data.defaultPreferredDate),
          defaultPreferredTime: data.defaultPreferredTime,
          alternativeDate: data.alternativeDate ? new Date(data.alternativeDate) : null,
          notes: data.notes,
          contactPreference: data.contactPreference,
          status: 'pending',
        },
      })

      // Create individual bookings for each configuration
      const bookings = []
      for (const configData of data.configurations) {
        // Generate unique reference number for each booking
        let referenceNumber = generateReferenceNumber()
        let refAttempts = 0
        while (await tx.booking.findUnique({ where: { referenceNumber } })) {
          referenceNumber = generateReferenceNumber()
          refAttempts++
          if (refAttempts > 10) {
            throw new Error('Failed to generate booking reference')
          }
        }

        const usesGroupDefaults = !configData.preferredDate && !configData.preferredTime
        const preferredDate = configData.preferredDate
          ? new Date(configData.preferredDate)
          : new Date(data.defaultPreferredDate)
        const preferredTime = configData.preferredTime || data.defaultPreferredTime

        const booking = await tx.booking.create({
          data: {
            userId: req.userId!,
            configurationId: configData.configurationId,
            bookingGroupId: bookingGroup.id,
            referenceNumber,
            preferredDate,
            preferredTime,
            alternativeDate: data.alternativeDate ? new Date(data.alternativeDate) : null,
            usesGroupDefaults,
            notes: data.notes,
            contactPreference: data.contactPreference,
            status: 'pending',
          },
          include: {
            configuration: {
              include: {
                template: true,
                sportsground: true,
              },
            },
          },
        })

        bookings.push(booking)
      }

      return { bookingGroup, bookings }
    })

    // Send batch confirmation email to customer
    const configDetails = result.bookings.map(b => ({
      referenceNumber: b.referenceNumber,
      name: b.configuration.name,
      templateName: b.configuration.template.name,
      dimensions: `${b.configuration.lengthMeters}m x ${b.configuration.widthMeters}m`,
      lineColor: b.configuration.lineColor,
      preferredDate: b.preferredDate.toLocaleDateString(),
      preferredTime: b.preferredTime,
    }))

    // Send confirmation email (using existing function for now, can be enhanced later)
    for (const booking of result.bookings) {
      await sendBookingConfirmationEmail({
        to: user.email,
        referenceNumber: booking.referenceNumber,
        customerName: user.fullName,
        sportsgroundName: sportsground.name,
        sportsgroundAddress: sportsground.address,
        templateName: booking.configuration.template.name,
        dimensions: `${booking.configuration.lengthMeters}m x ${booking.configuration.widthMeters}m`,
        lineColor: booking.configuration.lineColor,
        preferredDate: booking.preferredDate.toLocaleDateString(),
        preferredTime: booking.preferredTime,
      })
    }

    // Send provider notification for each booking
    for (const booking of result.bookings) {
      await sendProviderNotificationEmail({
        referenceNumber: booking.referenceNumber,
        customerName: user.fullName,
        customerEmail: user.email,
        customerPhone: user.phone,
        customerOrganization: user.organization,
        sportsgroundName: sportsground.name,
        sportsgroundAddress: sportsground.address,
        latitude: booking.configuration.latitude,
        longitude: booking.configuration.longitude,
        templateName: booking.configuration.template.name,
        dimensions: `${booking.configuration.lengthMeters}m x ${booking.configuration.widthMeters}m`,
        rotation: booking.configuration.rotationDegrees,
        lineColor: booking.configuration.lineColor,
        preferredDate: booking.preferredDate.toLocaleDateString(),
        preferredTime: booking.preferredTime,
        alternativeDate: booking.alternativeDate?.toLocaleDateString(),
        notes: booking.notes,
        contactPreference: booking.contactPreference,
      })
    }

    res.status(201).json({
      bookingGroup: {
        id: result.bookingGroup.id,
        groupReferenceNumber: result.bookingGroup.groupReferenceNumber,
        status: result.bookingGroup.status,
        createdAt: result.bookingGroup.createdAt,
      },
      bookings: result.bookings.map(b => ({
        id: b.id,
        referenceNumber: b.referenceNumber,
        configurationId: b.configurationId,
        configurationName: b.configuration.name,
        preferredDate: b.preferredDate,
        preferredTime: b.preferredTime,
      })),
    })
  } catch (error) {
    console.error('Create batch booking error:', error)
    res.status(500).json({ error: 'Failed to create batch booking' })
  }
})

// GET /api/bookings/groups/:id - Get booking group with all bookings
router.get('/groups/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const bookingGroup = await prisma.bookingGroup.findFirst({
      where: {
        id,
        userId: req.userId,
      },
      include: {
        sportsground: true,
        bookings: {
          include: {
            configuration: {
              include: {
                template: true,
              },
            },
          },
        },
      },
    })

    if (!bookingGroup) {
      return res.status(404).json({ error: 'Booking group not found' })
    }

    res.json(bookingGroup)
  } catch (error) {
    console.error('Get booking group error:', error)
    res.status(500).json({ error: 'Failed to get booking group' })
  }
})

// DELETE /api/bookings/groups/:id - Cancel entire booking group
router.delete('/groups/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    // Check ownership
    const bookingGroup = await prisma.bookingGroup.findFirst({
      where: { id, userId: req.userId },
      include: { bookings: true },
    })

    if (!bookingGroup) {
      return res.status(404).json({ error: 'Booking group not found' })
    }

    if (bookingGroup.status !== 'pending') {
      return res.status(400).json({
        error: 'Only pending booking groups can be cancelled'
      })
    }

    // Check if any booking is within 48 hours
    const now = new Date()
    for (const booking of bookingGroup.bookings) {
      const hoursUntilBooking = (booking.preferredDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      if (hoursUntilBooking < 48) {
        return res.status(400).json({
          error: 'Cannot cancel group: one or more bookings are within 48 hours of their preferred date'
        })
      }
    }

    // Cancel all bookings in the group
    await prisma.$transaction([
      prisma.booking.updateMany({
        where: { bookingGroupId: id },
        data: { status: 'cancelled' },
      }),
      prisma.bookingGroup.update({
        where: { id },
        data: { status: 'cancelled' },
      }),
    ])

    res.json({ message: 'Booking group cancelled successfully' })
  } catch (error) {
    console.error('Cancel booking group error:', error)
    res.status(500).json({ error: 'Failed to cancel booking group' })
  }
})

export default router
