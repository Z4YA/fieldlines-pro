import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Import routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import sportsgroundRoutes from './routes/sportsgrounds.js'
import templateRoutes from './routes/templates.js'
import configurationRoutes from './routes/configurations.js'
import bookingRoutes from './routes/bookings.js'
import adminRoutes from './routes/admin.js'
import settingsRoutes from './routes/settings.js'

// Import middleware
import { isMaintenanceModeEnabled, checkMaintenanceMode } from './middleware/maintenance.js'
import { authenticate, AuthRequest } from './middleware/auth.js'

const app = express()
const PORT = process.env.PORT || 9501

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:9500',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Public maintenance status endpoint (no auth required)
app.get('/api/maintenance/status', async (req, res) => {
  const enabled = await isMaintenanceModeEnabled()
  res.json({ maintenanceMode: enabled })
})

// Apply maintenance mode check to all subsequent routes
// This middleware checks if maintenance mode is enabled and blocks non-admin users
app.use((req: AuthRequest, res, next) => {
  // First try to authenticate the user (optional, won't fail if no token)
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken')
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'development-secret'
      ) as { userId: string; email: string }
      req.userId = decoded.userId
      req.userEmail = decoded.email
    } catch {
      // Invalid token, continue without auth
    }
  }
  next()
})

// Apply maintenance mode middleware
app.use(checkMaintenanceMode)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/sportsgrounds', sportsgroundRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/configurations', configurationRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/settings', settingsRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`XACTLINE API server running on port ${PORT}`)
})

export default app
