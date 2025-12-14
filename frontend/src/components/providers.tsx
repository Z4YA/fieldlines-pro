'use client'

import { AuthProvider } from '@/lib/auth-context'
import { BookingCartProvider } from '@/lib/booking-cart-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BookingCartProvider>
        {children}
      </BookingCartProvider>
    </AuthProvider>
  )
}
