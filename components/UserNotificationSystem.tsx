"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
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
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

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

export default function UserNotificationSystem() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  // Generate notifications based on user data
  useEffect(() => {
    if (!user) return

    const generateNotifications = async () => {
      const newNotifications: Notification[] = []

      try {
        // Get user's appointments
        const appointmentsRef = collection(db, "appointments")
        const appointmentsQuery = query(
          appointmentsRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(10),
        )

        const appointmentsSnapshot = await getDocs(appointmentsQuery)
        const userAppointments = appointmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Check for pending appointments
        const pendingAppointments = userAppointments.filter((apt) => apt.appointmentStatus === "PENDING")
        if (pendingAppointments.length > 0) {
          newNotifications.push({
            id: `pending-appointments-${Date.now()}`,
            title: "Pending Appointments",
            message: `You have ${pendingAppointments.length} appointment${pendingAppointments.length > 1 ? "s" : ""} awaiting confirmation`,
            type: "warning",
            timestamp: new Date(),
            read: false,
            action: {
              label: "View Appointments",
              onClick: () => (window.location.href = "/dashboard/appointments"),
            },
          })
        }

        // Check for upcoming appointments (next 24 hours)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowStr = tomorrow.toISOString().split("T")[0]

        const upcomingAppointments = userAppointments.filter(
          (apt) => apt.appointmentDate === tomorrowStr && apt.appointmentStatus === "CONFIRMED",
        )

        if (upcomingAppointments.length > 0) {
          upcomingAppointments.forEach((apt) => {
            newNotifications.push({
              id: `upcoming-${apt.id}`,
              title: "Appointment Reminder",
              message: `You have a ${apt.appointmentType} appointment tomorrow at ${apt.appointmentTime || "TBD"}`,
              type: "info",
              timestamp: new Date(),
              read: false,
              action: {
                label: "View Details",
                onClick: () => (window.location.href = "/dashboard/appointments"),
              },
            })
          })
        }

        // Check for profile completeness
        if (profile && (!profile.firstName || !profile.phoneNumber || !profile.address)) {
          newNotifications.push({
            id: `incomplete-profile-${Date.now()}`,
            title: "Complete Your Profile",
            message: "Please complete your profile information for better service",
            type: "info",
            timestamp: new Date(),
            read: false,
            action: {
              label: "Update Profile",
              onClick: () => (window.location.href = "/dashboard/profile"),
            },
          })
        }

        // Get recent announcements
        const announcementsRef = collection(db, "announcements")
        const announcementsQuery = query(announcementsRef, orderBy("createdAt", "desc"), limit(3))
        const announcementsSnapshot = await getDocs(announcementsQuery)

        announcementsSnapshot.docs.forEach((doc) => {
          const announcement = doc.data()
          const createdAt = announcement.createdAt?.toDate() || new Date()
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

          // Only show announcements from the last day
          if (createdAt > oneDayAgo) {
            newNotifications.push({
              id: `announcement-${doc.id}`,
              title: "New Announcement",
              message: announcement.title,
              type: "info",
              timestamp: createdAt,
              read: false,
            })
          }
        })

        // Sort by timestamp (newest first) and limit to 10
        newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        setNotifications(newNotifications.slice(0, 10))
      } catch (error) {
        console.error("Error generating notifications:", error)
        // Add error notification
        setNotifications([
          {
            id: `error-${Date.now()}`,
            title: "Notification Error",
            message: "Unable to load some notifications",
            type: "error",
            timestamp: new Date(),
            read: false,
          },
        ])
      }
    }

    generateNotifications()

    // Set up real-time listener for announcements
    const unsubscribe = onSnapshot(
      query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(3)),
      () => {
        generateNotifications() // Regenerate when announcements change
      },
    )

    return () => unsubscribe()
  }, [user, profile])

  // Show toast notifications for new notifications
  useEffect(() => {
    const unreadNotifications = notifications.filter((n) => !n.read)
    if (unreadNotifications.length > 0) {
      const latestNotification = unreadNotifications[0]

      // Only show toast for the most recent notification
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
