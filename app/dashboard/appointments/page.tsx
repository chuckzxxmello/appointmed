"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import ProtectedRoute from "@/components/ProtectedRoute"
import DashboardHeader from "@/components/DashboardHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface UserAppointment {
  id: string
  appointmentDate: string
  appointmentTimeStart: string
  appointmentTimeEnd: string
  appointmentType: string
  appointmentStatus: string
  paymentStatus: string
  payment: string
  doctor: string
  firstName: string
  surname: string
  email: string
  createdAt: any
}

export default function UserAppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<UserAppointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<UserAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")

  // Fetch user's appointments
  useEffect(() => {
    const fetchUserAppointments = async () => {
      if (!user?.email) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        console.log("Fetching appointments for user:", user.email)

        const appointmentsRef = collection(db, "appointments")

        // Try different query approaches
        let querySnapshot
        try {
          // First try with email field
          const emailQuery = query(appointmentsRef, where("email", "==", user.email))
          querySnapshot = await getDocs(emailQuery)
          console.log("Query by email found:", querySnapshot.size, "appointments")
        } catch (emailError) {
          console.log("Email query failed, trying userId:", emailError)
          // Fallback to userId if available
          if (user.uid) {
            const uidQuery = query(appointmentsRef, where("userId", "==", user.uid))
            querySnapshot = await getDocs(uidQuery)
            console.log("Query by userId found:", querySnapshot.size, "appointments")
          }
        }

        if (!querySnapshot || querySnapshot.empty) {
          console.log("No appointments found, trying to fetch all and filter")
          // Last resort: fetch all and filter client-side
          const allQuery = query(appointmentsRef)
          const allSnapshot = await getDocs(allQuery)
          console.log("Total appointments in database:", allSnapshot.size)

          const userAppointments: UserAppointment[] = []
          allSnapshot.forEach((doc) => {
            const data = doc.data()
            console.log("Checking appointment:", data.email, "vs", user.email)
            if (data.email === user.email || data.userId === user.uid) {
              userAppointments.push({
                id: doc.id,
                appointmentDate: data.appointmentDate || "",
                appointmentTimeStart: data.appointmentTimeStart || "",
                appointmentTimeEnd: data.appointmentTimeEnd || "",
                appointmentType: data.appointmentType || "",
                appointmentStatus: data.appointmentStatus || "PENDING",
                paymentStatus: data.paymentStatus || "NOT_PAID",
                payment: data.payment || "0",
                doctor: data.doctor || "",
                firstName: data.firstName || "",
                surname: data.surname || "",
                email: data.email || "",
                createdAt: data.createdAt,
              })
            }
          })

          console.log("Found user appointments:", userAppointments.length)
          setAppointments(userAppointments)
          setFilteredAppointments(userAppointments)
        } else {
          const userAppointments: UserAppointment[] = []
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            userAppointments.push({
              id: doc.id,
              appointmentDate: data.appointmentDate || "",
              appointmentTimeStart: data.appointmentTimeStart || "",
              appointmentTimeEnd: data.appointmentTimeEnd || "",
              appointmentType: data.appointmentType || "",
              appointmentStatus: data.appointmentStatus || "PENDING",
              paymentStatus: data.paymentStatus || "NOT_PAID",
              payment: data.payment || "0",
              doctor: data.doctor || "",
              firstName: data.firstName || "",
              surname: data.surname || "",
              email: data.email || "",
              createdAt: data.createdAt,
            })
          })

          console.log("Found appointments:", userAppointments.length)
          setAppointments(userAppointments)
          setFilteredAppointments(userAppointments)
        }
      } catch (error) {
        console.error("Error fetching appointments:", error)
        setError("Failed to load appointments. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchUserAppointments()
  }, [user?.email, user?.uid])

  // Filter appointments
  useEffect(() => {
    let filtered = appointments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.appointmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.doctor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.appointmentDate?.includes(searchTerm),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.appointmentStatus?.toLowerCase() === statusFilter)
    }

    // Payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter((apt) => apt.paymentStatus?.toLowerCase() === paymentFilter)
    }

    setFilteredAppointments(filtered)
  }, [appointments, searchTerm, statusFilter, paymentFilter])

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return (
          <Badge className="bg-green-100 text-green-800 animate-scale-in">
            <CheckCircle className="mr-1 h-3 w-3" />
            Confirmed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 animate-scale-in">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "completed":
      case "finished":
        return (
          <Badge className="bg-blue-100 text-blue-800 animate-scale-in">
            <CheckCircle className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 animate-scale-in">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 animate-scale-in">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {status || "Unknown"}
          </Badge>
        )
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return (
          <Badge className="bg-green-100 text-green-800 animate-scale-in">
            <CheckCircle className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        )
      case "not_paid":
        return (
          <Badge className="bg-red-100 text-red-800 animate-scale-in">
            <XCircle className="mr-1 h-3 w-3" />
            Not Paid
          </Badge>
        )
      case "partial":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 animate-scale-in">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Partial
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 animate-scale-in">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {status || "Unknown"}
          </Badge>
        )
    }
  }

  const appointmentStats = {
    total: appointments.length,
    pending: appointments.filter((apt) => apt.appointmentStatus === "PENDING").length,
    confirmed: appointments.filter((apt) => apt.appointmentStatus === "CONFIRMED").length,
    completed: appointments.filter(
      (apt) => apt.appointmentStatus === "COMPLETED" || apt.appointmentStatus === "FINISHED",
    ).length,
    cancelled: appointments.filter((apt) => apt.appointmentStatus === "CANCELLED").length,
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 animate-slide-up">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">My Appointments</h1>
            <p className="text-xl text-gray-600">View and manage all your scheduled appointments</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 animate-slide-up">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid md:grid-cols-5 gap-6 mb-8">
            {[
              { title: "Total", value: appointmentStats.total, icon: Calendar, color: "blue" },
              { title: "Pending", value: appointmentStats.pending, icon: Clock, color: "yellow" },
              { title: "Confirmed", value: appointmentStats.confirmed, icon: CheckCircle, color: "green" },
              { title: "Completed", value: appointmentStats.completed, icon: CheckCircle, color: "blue" },
              { title: "Cancelled", value: appointmentStats.cancelled, icon: XCircle, color: "red" },
            ].map((stat, index) => (
              <Card
                key={stat.title}
                className={`border-2 border-gray-100 hover-lift stagger-item animate-scale-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className={`text-3xl font-bold text-${stat.color}-700`}>{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 text-${stat.color}-700 opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Appointments List */}
          <Card className="border-2 border-gray-100 shadow-lg mb-8 animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center">
                    <FileText className="mr-2 h-6 w-6 text-blue-900" />
                    All Appointments
                  </CardTitle>
                  <CardDescription>Filter and search through your appointments</CardDescription>
                </div>
                <Link href="/dashboard/calendar">
                  <Button className="bg-blue-900 hover:bg-blue-800 text-white hover-lift transition-all duration-300">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book New Appointment
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading appointments...</p>
                </div>
              ) : filteredAppointments.length > 0 ? (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment, index) => (
                    <div
                      key={appointment.id}
                      className={`p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 hover-lift medical-card stagger-item animate-slide-up`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                        <div className="flex items-start space-x-4">
                          <div className="bg-blue-50 w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-8 w-8 text-blue-900" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {appointment.appointmentType?.replace(/_/g, " ") || "Appointment"}
                            </h3>
                            <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>
                                  {appointment.appointmentDate
                                    ? new Date(appointment.appointmentDate).toLocaleDateString()
                                    : "Date TBD"}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4" />
                                <span>
                                  {appointment.appointmentTimeStart && appointment.appointmentTimeEnd
                                    ? `${appointment.appointmentTimeStart} - ${appointment.appointmentTimeEnd}`
                                    : "Time TBD"}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <User className="mr-2 h-4 w-4" />
                                <span>{appointment.doctor || "Doctor TBD"}</span>
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="mr-2 h-4 w-4" />
                                <span>₱{appointment.payment || "0"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 md:items-end">
                          {getStatusBadge(appointment.appointmentStatus)}
                          {getPaymentBadge(appointment.paymentStatus)}
                          <p className="text-xs text-gray-500">
                            Booked: {appointment.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 animate-fade-in">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No appointments found</h3>
                  <p className="text-gray-500 mb-6">You haven't scheduled any appointments yet</p>
                  <Link href="/dashboard/calendar">
                    <Button className="bg-blue-900 hover:bg-blue-800 text-white hover-lift transition-all duration-300">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Your First Appointment
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
