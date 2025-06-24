"use client"

import type React from "react"

import { AdminDataProvider } from "@/contexts/AdminDataContext"
import { Toaster } from "@/components/ui/toaster"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminDataProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
        <Toaster />
      </div>
    </AdminDataProvider>
  )
}
