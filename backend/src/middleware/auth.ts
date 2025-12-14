import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
  userRole?: string
}

interface JWTPayload {
  userId: string
  email: string
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'development-secret'
    ) as JWTPayload

    req.userId = decoded.userId
    req.userEmail = decoded.email

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'development-secret'
    ) as JWTPayload

    req.userId = decoded.userId
    req.userEmail = decoded.email

    next()
  } catch {
    // If token is invalid, continue without authentication
    next()
  }
}

// Middleware to require admin or super_admin role
export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    req.userRole = user.role
    next()
  } catch (error) {
    console.error('Admin check error:', error)
    return res.status(500).json({ error: 'Authorization check failed' })
  }
}
