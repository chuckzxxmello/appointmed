"use client"

import { useState, useEffect } from "react"
import { collection, query, getDocs, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/useAuth"
import ProtectedRoute from "@/components/ProtectedRoute"
import DashboardHeader from "@/components/DashboardHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, MapPin, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { getUserAppointments } from "@/lib/admin"

interface Appointment {
  id: string
  appointmentDate: string
  appointmentTimeStart: string
  appointmentTimeEnd: string
  appointmentType: string
  appointmentStatus: string
  doctor: string
  contact: string
  email: string
  firstName: string
  middleName?: string
  surname: string
  payment: string
  paymentStatus: string
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return

      try {
        setLoading(true)
        const appointmentsData = await getUserAppointments(user.email)
        console.log("Calendar appointments:", appointmentsData)
        setAppointments(appointmentsData as Appointment[])
      } catch (error) {
        console.error("Error fetching appointments:", error)
        // Fallback approach
        try {
          const appointmentsQuery = query(collection(db, "appointments"), where("email", "==", user.email))
          const appointmentsSnapshot = await getDocs(appointmentsQuery)
          const appointmentsData = appointmentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Appointment[]
          setAppointments(appointmentsData)
        } catch (fallbackError) {
          console.error("Calendar fallback fetch failed:", fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [user])

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
      days.push(day)
    }

    return days
  }

  const getAppointmentsForDate = (date: string) => {
    return appointments.filter((apt) => apt.appointmentDate === date)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    if (filterStatus === "all") return true
    return apt.appointmentStatus.toLowerCase() === filterStatus
  })

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

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

  const days = getDaysInMonth(currentDate)

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Appointment Calendar</h1>
            <p className="text-xl text-gray-600">View your scheduled appointments and therapy sessions</p>
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
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="p-2 text-center font-semibold text-gray-600 text-sm">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                      if (day === null) {
                        return <div key={index} className="p-2 h-20"></div>
                      }

                      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                      const dayAppointments = getAppointmentsForDate(dateString)
                      const isSelected = selectedDate === dateString
                      const isToday =
                        new Date().toDateString() ===
                        new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

                      return (
                        <div
                          key={day}
                          className={`p-2 h-20 border border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors ${
                            isSelected ? "bg-blue-100 border-blue-300" : ""
                          } ${isToday ? "bg-yellow-50 border-yellow-300" : ""}`}
                          onClick={() => setSelectedDate(dateString)}
                        >
                          <div className="text-sm font-medium text-gray-900">{day}</div>
                          {dayAppointments.length > 0 && (
                            <div className="mt-1">
                              <div className="text-xs bg-blue-500 text-white rounded px-1 py-0.5 truncate">
                                {dayAppointments.length} apt{dayAppointments.length > 1 ? "s" : ""}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Filter */}
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Filter className="mr-2 h-5 w-5 text-blue-900" />
                    Filter Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {["all", "pending", "confirmed", "completed", "cancelled"].map((status) => (
                      <Button
                        key={status}
                        variant={filterStatus === status ? "default" : "outline"}
                        className={`w-full justify-start ${
                          filterStatus === status
                            ? "bg-blue-900 text-white"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() => setFilterStatus(status)}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Date Details */}
              {selectedDate && (
                <Card className="border-2 border-gray-100">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDateAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {selectedDateAppointments.map((appointment) => (
                          <div key={appointment.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{appointment.appointmentType}</h4>
                              <Badge className={getStatusColor(appointment.appointmentStatus)}>
                                {appointment.appointmentStatus}
                              </Badge>
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
                              <div className="flex items-center">
                                <MapPin className="mr-2 h-4 w-4" />₱{appointment.payment}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No appointments on this date</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Appointments */}
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-xl">Upcoming Appointments</CardTitle>
                  <CardDescription>Next 5 appointments</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredAppointments.slice(0, 5).length > 0 ? (
                    <div className="space-y-3">
                      {filteredAppointments.slice(0, 5).map((appointment) => (
                        <div key={appointment.id} className="p-3 border border-gray-200 rounded-lg bg-white">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900 text-sm">{appointment.appointmentType}</h4>
                            <Badge className={`${getStatusColor(appointment.appointmentStatus)} text-xs`}>
                              {appointment.appointmentStatus}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600">
                            <div className="flex items-center mb-1">
                              <Calendar className="mr-1 h-3 w-3" />
                              {new Date(appointment.appointmentDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {appointment.appointmentTimeStart}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
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
