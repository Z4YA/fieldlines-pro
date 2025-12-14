import { Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthRequest } from './auth.js'

// Middleware to require admin role (admin or super_admin)
export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    next()
  } catch (error) {
    console.error('Admin authorization error:', error)
    return res.status(500).json({ error: 'Authorization check failed' })
  }
}

// Middleware to require super_admin role only
export async function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' })
    }

    next()
  } catch (error) {
    console.error('Super admin authorization error:', error)
    return res.status(500).json({ error: 'Authorization check failed' })
  }
}
