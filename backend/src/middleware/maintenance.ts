import { Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma.js'
import { AuthRequest } from './auth.js'

// Cache maintenance status to avoid hitting DB on every request
let maintenanceModeCache: { enabled: boolean; lastCheck: number } = {
  enabled: false,
  lastCheck: 0,
}

const CACHE_DURATION_MS = 5000 // 5 seconds

async function isMaintenanceModeEnabled(): Promise<boolean> {
  const now = Date.now()

  // Return cached value if still valid
  if (now - maintenanceModeCache.lastCheck < CACHE_DURATION_MS) {
    return maintenanceModeCache.enabled
  }

  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'maintenance_mode' },
    })

    maintenanceModeCache = {
      enabled: setting?.value === 'true',
      lastCheck: now,
    }

    return maintenanceModeCache.enabled
  } catch (error) {
    console.error('Error checking maintenance mode:', error)
    return false // Default to not in maintenance mode if there's an error
  }
}

// Clear the cache when maintenance mode is toggled
export function clearMaintenanceCache() {
  maintenanceModeCache.lastCheck = 0
}

// Paths that are always allowed (even in maintenance mode)
const ALWAYS_ALLOWED_PATHS = [
  '/health',
  '/api/auth/login',
  '/api/auth/admin/validate-invitation',
  '/api/auth/admin/register',
  '/api/maintenance/status',
]

// Middleware to check maintenance mode
export async function checkMaintenanceMode(req: AuthRequest, res: Response, next: NextFunction) {
  // Always allow certain paths
  if (ALWAYS_ALLOWED_PATHS.some(path => req.path === path || req.path.startsWith(path))) {
    return next()
  }

  const isMaintenanceMode = await isMaintenanceModeEnabled()

  if (!isMaintenanceMode) {
    return next()
  }

  // In maintenance mode - check if user is admin
  // If the request has a userId (authenticated), check their role
  if (req.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { role: true },
      })

      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        return next() // Admins can proceed
      }
    } catch (error) {
      console.error('Error checking user role in maintenance mode:', error)
    }
  }

  // Block the request with maintenance mode message
  return res.status(503).json({
    error: 'maintenance_mode',
    message: 'The platform is currently undergoing maintenance. Please try again later.',
  })
}

// Export function to get maintenance status (for the public endpoint)
export { isMaintenanceModeEnabled }
