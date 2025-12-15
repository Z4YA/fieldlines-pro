'use client'

import { useState, useCallback } from 'react'
import { AdminRoute } from '@/components/admin-route'
import { AdminSidebar, AdminMobileHeader } from '@/components/admin/sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <AdminRoute>
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Mobile header with hamburger */}
        <AdminMobileHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

        {/* Main content */}
        <main className="flex-1 bg-gray-100 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </AdminRoute>
  )
}
