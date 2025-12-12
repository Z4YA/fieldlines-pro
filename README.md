# XACTLINE

A web-based platform for designing, visualizing, and booking professional sports field line marking services.

## Project Structure

```
fieldlines-pro/
├── frontend/          # Next.js 14 application (Vercel)
├── backend/           # Express API server (Render)
└── sportsfield-linemarkings-prd.md  # Product Requirements Document
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL (Render)
- **Mapping**: Mapbox GL JS
- **Canvas**: Fabric.js
- **Authentication**: NextAuth.js

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn
- Mapbox account (for API token)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd fieldlines-pro
```

### 2. Set up the Backend

```bash
cd backend
npm install

# Copy environment file and update with your values
cp .env.example .env

# Set up PostgreSQL database
# Create a database called 'fieldlines_pro'

# Run Prisma migrations
npx prisma generate
npx prisma db push

# Seed the database with field templates
npm run db:seed

# Start development server (port 9501)
npm run dev
```

### 3. Set up the Frontend

```bash
cd frontend
npm install

# Copy environment file and update with your values
cp .env.example .env.local

# Add your Mapbox token to .env.local
# Get one at https://account.mapbox.com/

# Start development server (port 9500)
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:9500
- Backend API: http://localhost:9501
- API Health Check: http://localhost:9501/health

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 9501) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT token signing |
| `FRONTEND_URL` | Frontend URL for CORS |
| `SENDGRID_API_KEY` | SendGrid API key for emails |
| `PROVIDER_EMAIL` | Email for booking notifications |

### Frontend (.env.local)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox access token |
| `NEXTAUTH_SECRET` | NextAuth.js secret |
| `NEXTAUTH_URL` | Frontend URL |

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `POST /api/users/me/change-password` - Change password

### Sportsgrounds
- `GET /api/sportsgrounds` - List user's sportsgrounds
- `POST /api/sportsgrounds` - Create sportsground
- `GET /api/sportsgrounds/:id` - Get sportsground
- `PUT /api/sportsgrounds/:id` - Update sportsground
- `DELETE /api/sportsgrounds/:id` - Delete sportsground

### Templates
- `GET /api/templates` - List field templates
- `GET /api/templates/:id` - Get template details

### Configurations
- `GET /api/configurations` - List user's configurations
- `POST /api/configurations` - Save configuration
- `GET /api/configurations/:id` - Get configuration
- `PUT /api/configurations/:id` - Update configuration
- `DELETE /api/configurations/:id` - Delete configuration
- `POST /api/configurations/:id/duplicate` - Duplicate configuration

### Bookings
- `GET /api/bookings` - List user's bookings
- `POST /api/bookings` - Create booking request
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

## Deployment

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set root directory to `frontend`
3. Configure environment variables
4. Deploy

### Backend (Render)
1. Create a new Web Service on Render
2. Connect GitHub repository
3. Set root directory to `backend`
4. Set build command: `npm install && npx prisma generate && npm run build`
5. Set start command: `npm start`
6. Create a PostgreSQL database on Render
7. Configure environment variables
8. Deploy

## Development Scripts

### Backend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run db:seed  # Seed database
```

### Frontend
```bash
npm run dev      # Start dev server (port 9500)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

Private - All rights reserved
