'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingCart } from '@/lib/booking-cart-context'
import { Button } from '@/components/ui/button'

export function FloatingCart() {
  const router = useRouter()
  const {
    selectedConfigurations,
    sportsgroundName,
    removeConfiguration,
    clearCart,
    totalCount,
  } = useBookingCart()

  const [isExpanded, setIsExpanded] = useState(false)

  // Don't render if cart is empty
  if (totalCount === 0) {
    return null
  }

  const handleProceedToBook = () => {
    router.push('/dashboard/bookings/multi')
  }

  const getColorHex = (color: string): string => {
    const colorMap: Record<string, string> = {
      white: '#FFFFFF',
      yellow: '#FFFF00',
      blue: '#0066FF',
      orange: '#FF6600',
      red: '#FF0000',
      green: '#00FF00',
    }
    return colorMap[color.toLowerCase()] || '#FFFFFF'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Collapsed view - just the badge */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="font-semibold">{totalCount} Field{totalCount > 1 ? 's' : ''} Selected</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Expanded view */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-80 max-h-[500px] flex flex-col animate-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="font-semibold text-gray-900">Booking Cart</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Sportsground info */}
          <div className="px-4 py-2 bg-green-50 border-b border-green-100">
            <p className="text-xs text-green-700 font-medium">Booking from:</p>
            <p className="text-sm text-green-900 font-semibold truncate">{sportsgroundName}</p>
          </div>

          {/* Configuration list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {selectedConfigurations.map((config) => (
              <div
                key={config.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{config.name}</p>
                  <p className="text-xs text-gray-500">{config.templateName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {config.lengthMeters}m x {config.widthMeters}m
                    </span>
                    <div
                      className="w-3 h-3 rounded border border-gray-300"
                      style={{ backgroundColor: getColorHex(config.lineColor) }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeConfiguration(config.id)}
                  className="ml-2 text-gray-400 hover:text-red-500 p-1 flex-shrink-0"
                  title="Remove from cart"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg space-y-2">
            <Button
              onClick={handleProceedToBook}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book {totalCount} Field{totalCount > 1 ? 's' : ''}
            </Button>
            <button
              onClick={clearCart}
              className="w-full text-sm text-gray-500 hover:text-red-600 py-1"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
