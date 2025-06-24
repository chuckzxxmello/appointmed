"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import {
  getAllUsers,
  getAppointmentsWithDetails,
  getAnnouncementsWithDetails,
  subscribeToAppointments,
  subscribeToAnnouncements,
} from "@/lib/admin"
import { useAuth } from "@/hooks/useAuth"

interface AdminDataContextType {
  users: any[]
  appointments: any[]
  announcements: any[]
  loading: {
    users: boolean
    appointments: boolean
    announcements: boolean
  }
  error: {
    users: string | null
    appointments: string | null
    announcements: string | null
  }
  refreshUsers: () => Promise<void>
  refreshAppointments: () => Promise<void>
  refreshAnnouncements: () => Promise<void>
  refreshAll: () => Promise<void>
}

const AdminDataContext = createContext<AdminDataContextType | null>(null)

export const useAdminData = () => {
  const context = useContext(AdminDataContext)
  if (!context) {
    throw new Error("useAdminData must be used within AdminDataProvider")
  }
  return context
}

export const AdminDataProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, user } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState({
    users: true,
    appointments: true,
    announcements: true,
  })
  const [error, setError] = useState({
    users: null as string | null,
    appointments: null as string | null,
    announcements: null as string | null,
  })

  // Use refs to track if initial load has happened
  const initialLoadRef = useRef(false)
  const unsubscribersRef = useRef<(() => void)[]>([])

  const refreshUsers = useCallback(async () => {
    if (!isAdmin) return

    try {
      setLoading((prev) => ({ ...prev, users: true }))
      setError((prev) => ({ ...prev, users: null }))
      const usersData = await getAllUsers()
      setUsers(usersData)
      console.log("Refreshed users:", usersData.length)
    } catch (error) {
      console.error("Error refreshing users:", error)
      setError((prev) => ({ ...prev, users: "Failed to load users" }))
    } finally {
      setLoading((prev) => ({ ...prev, users: false }))
    }
  }, [isAdmin])

  const refreshAppointments = useCallback(async () => {
    if (!isAdmin) return

    try {
      setLoading((prev) => ({ ...prev, appointments: true }))
      setError((prev) => ({ ...prev, appointments: null }))
      const appointmentsData = await getAppointmentsWithDetails()
      setAppointments(appointmentsData)
      console.log("Refreshed appointments:", appointmentsData.length)
    } catch (error) {
      console.error("Error refreshing appointments:", error)
      setError((prev) => ({ ...prev, appointments: "Failed to load appointments" }))
    } finally {
      setLoading((prev) => ({ ...prev, appointments: false }))
    }
  }, [isAdmin])

  const refreshAnnouncements = useCallback(async () => {
    if (!isAdmin) return

    try {
      setLoading((prev) => ({ ...prev, announcements: true }))
      setError((prev) => ({ ...prev, announcements: null }))
      const announcementsData = await getAnnouncementsWithDetails()
      setAnnouncements(announcementsData)
      console.log("Refreshed announcements:", announcementsData.length)
    } catch (error) {
      console.error("Error refreshing announcements:", error)
      setError((prev) => ({ ...prev, announcements: "Failed to load announcements" }))
    } finally {
      setLoading((prev) => ({ ...prev, announcements: false }))
    }
  }, [isAdmin])

  const refreshAll = useCallback(async () => {
    if (!isAdmin) return
    console.log("Refreshing all admin data...")
    await Promise.all([refreshUsers(), refreshAppointments(), refreshAnnouncements()])
  }, [isAdmin, refreshUsers, refreshAppointments, refreshAnnouncements])

  // Initial data load and real-time listeners setup
  useEffect(() => {
    if (!isAdmin || !user || initialLoadRef.current) {
      return
    }

    console.log("Setting up admin data for:", user?.email)
    initialLoadRef.current = true

    // Initial data fetch for users (no real-time listener for users)
    refreshUsers()

    // Set up real-time listeners for appointments and announcements
    const unsubscribeAppointments = subscribeToAppointments((appointmentsData) => {
      console.log("Real-time appointments update:", appointmentsData.length)
      setAppointments(appointmentsData)
      setLoading((prev) => ({ ...prev, appointments: false }))
      setError((prev) => ({ ...prev, appointments: null }))
    })

    const unsubscribeAnnouncements = subscribeToAnnouncements((announcementsData) => {
      console.log("Real-time announcements update:", announcementsData.length)
      setAnnouncements(announcementsData)
      setLoading((prev) => ({ ...prev, announcements: false }))
      setError((prev) => ({ ...prev, announcements: null }))
    })

    // Store unsubscribers
    unsubscribersRef.current = [unsubscribeAppointments, unsubscribeAnnouncements]

    // Cleanup function
    return () => {
      console.log("Cleaning up admin data listeners")
      unsubscribersRef.current.forEach((unsubscribe) => unsubscribe())
      unsubscribersRef.current = []
      initialLoadRef.current = false
    }
  }, [isAdmin, user?.email, refreshUsers]) // Removed refreshAll from dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribersRef.current.forEach((unsubscribe) => unsubscribe())
    }
  }, [])

  const value = {
    users,
    appointments,
    announcements,
    loading,
    error,
    refreshUsers,
    refreshAppointments,
    refreshAnnouncements,
    refreshAll,
  }

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}
