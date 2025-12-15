'use client'

import { AuthProvider } from '@/lib/auth-context'
import { BookingCartProvider } from '@/lib/booking-cart-context'
import { MaintenanceProvider } from '@/components/maintenance-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MaintenanceProvider>
        <BookingCartProvider>
          {children}
        </BookingCartProvider>
      </MaintenanceProvider>
    </AuthProvider>
  )
}
