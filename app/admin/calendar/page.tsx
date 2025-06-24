"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useAdminData } from "@/contexts/AdminDataContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Calendar, ArrowLeft, Clock, User, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"

interface Appointment {
  id: string
  appointmentDate: string
  appointmentTimeStart: string
  appointmentTimeEnd: string
  appointmentType: string
  appointmentStatus: string
  doctor: string
  firstName: string
  surname: string
  email: string
}

export default function AdminCalendarPage() {
  const { isAdmin, user } = useAuth()
  const { appointments, loading } = useAdminData()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been securely signed out of the admin panel.",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    return appointments.filter((appointment) => appointment.appointmentDate === dateString)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800 text-xs">Confirmed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 text-xs">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">{status}</Badge>
    }
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const days = getDaysInMonth(currentDate)
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Heart className="h-8 w-8 text-blue-900" />
                <div>
                  <h1 className="text-xl font-bold text-blue-900">Calendar View</h1>
                  <p className="text-sm text-gray-600">Admin Panel</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
                <Link href="/admin">
                  <Button variant="outline" className="bg-white text-blue-900 border-blue-900 hover:bg-blue-50">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Admin
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Appointment Calendar</h1>
            <p className="text-xl text-gray-600">View appointments in calendar format</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-gray-100 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading.appointments ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading calendar...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-1">
                      {/* Day headers */}
                      {dayNames.map((day) => (
                        <div key={day} className="p-2 text-center font-semibold text-gray-600 text-sm">
                          {day}
                        </div>
                      ))}

                      {/* Calendar days */}
                      {days.map((day, index) => {
                        if (!day) {
                          return <div key={index} className="p-2 h-24"></div>
                        }

                        const dayAppointments = getAppointmentsForDate(day)
                        const isToday = day.toDateString() === new Date().toDateString()
                        const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString()

                        return (
                          <div
                            key={day.toISOString()}
                            className={`p-2 h-24 border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors ${
                              isToday ? "bg-blue-100 border-blue-300" : ""
                            } ${isSelected ? "bg-blue-200 border-blue-400" : ""}`}
                            onClick={() => setSelectedDate(day)}
                          >
                            <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-900" : "text-gray-900"}`}>
                              {day.getDate()}
                            </div>
                            <div className="space-y-1">
                              {dayAppointments.slice(0, 2).map((appointment, idx) => (
                                <div key={idx} className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate">
                                  {appointment.appointmentTimeStart} - {appointment.firstName}
                                </div>
                              ))}
                              {dayAppointments.length > 2 && (
                                <div className="text-xs text-gray-500">+{dayAppointments.length - 2} more</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Appointment Details */}
            <div className="space-y-6">
              {/* Stats */}
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-xl">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Appointments</span>
                    <span className="font-bold text-blue-900">{appointments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">This Month</span>
                    <span className="font-bold text-green-700">
                      {
                        appointments.filter((a) => {
                          const appointmentDate = new Date(a.appointmentDate)
                          return (
                            appointmentDate.getMonth() === currentDate.getMonth() &&
                            appointmentDate.getFullYear() === currentDate.getFullYear()
                          )
                        }).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Today</span>
                    <span className="font-bold text-purple-700">{getAppointmentsForDate(new Date()).length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Date Details */}
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    {selectedDate ? selectedDate.toLocaleDateString() : "Select a Date"}
                  </CardTitle>
                  <CardDescription>
                    {selectedDate
                      ? `${selectedDateAppointments.length} appointment${selectedDateAppointments.length !== 1 ? "s" : ""}`
                      : "Click on a date to view appointments"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    selectedDateAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {selectedDateAppointments.map((appointment) => (
                          <div key={appointment.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {appointment.firstName} {appointment.surname}
                                </h4>
                                <p className="text-sm text-gray-600">{appointment.email}</p>
                              </div>
                              {getStatusBadge(appointment.appointmentStatus)}
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4" />
                                {appointment.appointmentTimeStart} - {appointment.appointmentTimeEnd}
                              </div>
                              <div className="flex items-center">
                                <User className="mr-2 h-4 w-4" />
                                {appointment.doctor}
                              </div>
                              <div className="mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {appointment.appointmentType}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No appointments scheduled for this date</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Select a date to view appointments</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
