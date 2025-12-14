'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface SelectedConfiguration {
  id: string
  name: string
  sportsgroundId: string
  sportsgroundName: string
  templateName: string
  lengthMeters: number
  widthMeters: number
  lineColor: string
  // Per-config date customization
  customDate?: string
  customTime?: string
  useCustomDate: boolean
}

interface BookingCartContextType {
  selectedConfigurations: SelectedConfiguration[]
  sportsgroundId: string | null
  sportsgroundName: string | null
  addConfiguration: (config: Omit<SelectedConfiguration, 'useCustomDate' | 'customDate' | 'customTime'>) => boolean
  removeConfiguration: (id: string) => void
  clearCart: () => void
  isSelected: (id: string) => boolean
  canAddConfiguration: (sportsgroundId: string) => boolean
  updateConfigurationDate: (id: string, customDate: string, customTime: string) => void
  setUseCustomDate: (id: string, useCustom: boolean) => void
  totalCount: number
}

const BookingCartContext = createContext<BookingCartContextType | undefined>(undefined)

const STORAGE_KEY = 'booking-cart'

export function BookingCartProvider({ children }: { children: React.ReactNode }) {
  const [selectedConfigurations, setSelectedConfigurations] = useState<SelectedConfiguration[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Derived state
  const sportsgroundId = selectedConfigurations.length > 0
    ? selectedConfigurations[0].sportsgroundId
    : null
  const sportsgroundName = selectedConfigurations.length > 0
    ? selectedConfigurations[0].sportsgroundName
    : null

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setSelectedConfigurations(parsed)
        }
      }
    } catch (e) {
      console.error('Failed to load booking cart from storage:', e)
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedConfigurations))
      } catch (e) {
        console.error('Failed to save booking cart to storage:', e)
      }
    }
  }, [selectedConfigurations, isHydrated])

  const canAddConfiguration = useCallback((configSportsgroundId: string): boolean => {
    // Can add if cart is empty or sportsground matches
    return sportsgroundId === null || sportsgroundId === configSportsgroundId
  }, [sportsgroundId])

  const addConfiguration = useCallback((config: Omit<SelectedConfiguration, 'useCustomDate' | 'customDate' | 'customTime'>): boolean => {
    // Check if sportsground matches
    if (!canAddConfiguration(config.sportsgroundId)) {
      return false
    }

    // Check if already selected
    if (selectedConfigurations.some(c => c.id === config.id)) {
      return false
    }

    setSelectedConfigurations(prev => [
      ...prev,
      {
        ...config,
        useCustomDate: false,
        customDate: undefined,
        customTime: undefined,
      }
    ])
    return true
  }, [canAddConfiguration, selectedConfigurations])

  const removeConfiguration = useCallback((id: string) => {
    setSelectedConfigurations(prev => prev.filter(c => c.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setSelectedConfigurations([])
  }, [])

  const isSelected = useCallback((id: string): boolean => {
    return selectedConfigurations.some(c => c.id === id)
  }, [selectedConfigurations])

  const updateConfigurationDate = useCallback((id: string, customDate: string, customTime: string) => {
    setSelectedConfigurations(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, customDate, customTime, useCustomDate: true }
          : c
      )
    )
  }, [])

  const setUseCustomDate = useCallback((id: string, useCustom: boolean) => {
    setSelectedConfigurations(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, useCustomDate: useCustom }
          : c
      )
    )
  }, [])

  return (
    <BookingCartContext.Provider
      value={{
        selectedConfigurations,
        sportsgroundId,
        sportsgroundName,
        addConfiguration,
        removeConfiguration,
        clearCart,
        isSelected,
        canAddConfiguration,
        updateConfigurationDate,
        setUseCustomDate,
        totalCount: selectedConfigurations.length,
      }}
    >
      {children}
    </BookingCartContext.Provider>
  )
}

export function useBookingCart() {
  const context = useContext(BookingCartContext)
  if (context === undefined) {
    throw new Error('useBookingCart must be used within a BookingCartProvider')
  }
  return context
}
