"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useAdminData } from "@/contexts/AdminDataContext"
import { useToast } from "@/hooks/use-toast"
import { Bell, X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "warning" | "error" | "info"
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

export default function NotificationSystem() {
  const { user, isAdmin } = useAuth()
  const { appointments, announcements, loading, error } = useAdminData()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  // Use refs to track previous values and prevent duplicate notifications
  const prevErrorsRef = useRef<typeof error>({ users: null, appointments: null, announcements: null })
  const prevStatsRef = useRef({ appointmentsCount: 0, announcementsCount: 0 })
  const notificationIdsRef = useRef(new Set<string>())

  // Generate notifications based on data changes and errors
  useEffect(() => {
    if (!isAdmin || !user) return

    const newNotifications: Notification[] = []
    const currentTime = Date.now()

    // Error notifications - only add if error is new
    if (error.appointments && error.appointments !== prevErrorsRef.current.appointments) {
      const id = `error-appointments-${currentTime}`
      if (!notificationIdsRef.current.has(id)) {
        newNotifications.push({
          id,
          title: "Appointments Error",
          message: error.appointments,
          type: "error",
          timestamp: new Date(),
          read: false,
        })
        notificationIdsRef.current.add(id)
      }
    }

    if (error.announcements && error.announcements !== prevErrorsRef.current.announcements) {
      const id = `error-announcements-${currentTime}`
      if (!notificationIdsRef.current.has(id)) {
        newNotifications.push({
          id,
          title: "Announcements Error",
          message: error.announcements,
          type: "error",
          timestamp: new Date(),
          read: false,
        })
        notificationIdsRef.current.add(id)
      }
    }

    if (error.users && error.users !== prevErrorsRef.current.users) {
      const id = `error-users-${currentTime}`
      if (!notificationIdsRef.current.has(id)) {
        newNotifications.push({
          id,
          title: "Users Error",
          message: error.users,
          type: "error",
          timestamp: new Date(),
          read: false,
        })
        notificationIdsRef.current.add(id)
      }
    }

    // Success notifications for data loading - only once when loading completes
    if (!loading.appointments && appointments.length > 0 && !error.appointments) {
      const currentCount = appointments.length
      const prevCount = prevStatsRef.current.appointmentsCount

      if (currentCount !== prevCount && prevCount === 0) {
        const id = `appointments-loaded-${currentTime}`
        if (!notificationIdsRef.current.has(id)) {
          newNotifications.push({
            id,
            title: "Data Loaded",
            message: `Successfully loaded ${appointments.length} appointments`,
            type: "success",
            timestamp: new Date(),
            read: false,
          })
          notificationIdsRef.current.add(id)
        }
      }
      prevStatsRef.current.appointmentsCount = currentCount
    }

    // Warning notifications for pending appointments - only show once per session
    if (appointments.length > 0) {
      const pendingAppointments = appointments.filter((apt) => apt.appointmentStatus === "PENDING")
      if (pendingAppointments.length > 0) {
        const id = `pending-appointments-session`
        if (!notificationIdsRef.current.has(id)) {
          newNotifications.push({
            id,
            title: "Pending Appointments",
            message: `${pendingAppointments.length} appointments require attention`,
            type: "warning",
            timestamp: new Date(),
            read: false,
            action: {
              label: "View Appointments",
              onClick: () => (window.location.href = "/admin/appointments"),
            },
          })
          notificationIdsRef.current.add(id)
        }
      }
    }

    // Info notifications for new announcements - only for recent ones
    if (!loading.announcements && announcements.length > 0) {
      const recentAnnouncements = announcements.filter((ann) => {
        const createdAt = ann.createdAt?.toDate?.() || new Date(ann.createdAt)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return createdAt > oneDayAgo
      })

      const currentAnnouncementCount = announcements.length
      const prevAnnouncementCount = prevStatsRef.current.announcementsCount

      if (recentAnnouncements.length > 0 && currentAnnouncementCount !== prevAnnouncementCount) {
        const id = `new-announcements-${currentTime}`
        if (!notificationIdsRef.current.has(id)) {
          newNotifications.push({
            id,
            title: "New Announcements",
            message: `${recentAnnouncements.length} new announcements posted`,
            type: "info",
            timestamp: new Date(),
            read: false,
            action: {
              label: "View Announcements",
              onClick: () => (window.location.href = "/admin/announcements"),
            },
          })
          notificationIdsRef.current.add(id)
        }
      }
      prevStatsRef.current.announcementsCount = currentAnnouncementCount
    }

    // Update previous errors reference
    prevErrorsRef.current = { ...error }

    // Add new notifications
    if (newNotifications.length > 0) {
      setNotifications((prev) => {
        const combined = [...newNotifications, ...prev]
        return combined.slice(0, 10) // Keep only latest 10
      })
    }
  }, [appointments, announcements, error, loading, isAdmin, user])

  // Show toast notifications for new notifications
  useEffect(() => {
    const unreadNotifications = notifications.filter((n) => !n.read)
    if (unreadNotifications.length > 0) {
      const latestNotification = unreadNotifications[0]

      // Only show toast for the most recent notification (within last 5 seconds)
      const fiveSecondsAgo = new Date(Date.now() - 5000)
      if (latestNotification.timestamp > fiveSecondsAgo) {
        toast({
          title: latestNotification.title,
          description: latestNotification.message,
          variant: latestNotification.type === "error" ? "destructive" : "default",
        })
      }
    }
  }, [notifications, toast])

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    notificationIdsRef.current.delete(id)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-l-green-500 bg-green-50"
      case "warning":
        return "border-l-yellow-500 bg-yellow-50"
      case "error":
        return "border-l-red-500 bg-red-50"
      case "info":
      default:
        return "border-l-blue-500 bg-blue-50"
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (!user) return null

  return (
    <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 border-l-4 ${getNotificationColor(notification.type)} ${
                !notification.read ? "bg-opacity-100" : "bg-opacity-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{notification.timestamp.toLocaleTimeString()}</p>
                    {notification.action && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={notification.action.onClick}
                        className="mt-2 h-6 text-xs"
                      >
                        {notification.action.label}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="h-6 w-6 p-0"
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNotification(notification.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No notifications</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
