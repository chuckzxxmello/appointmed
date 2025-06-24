"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useAdminData } from "@/contexts/AdminDataContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  BarChart3,
  ArrowLeft,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"
import { toast } from "@/components/ui/use-toast"

interface Appointment {
  id: string
  appointmentDate: string
  appointmentType: string
  appointmentStatus: string
  payment: string
  paymentStatus: string
  createdAt: any
}

interface User {
  id: string
  createdAt: any
}

interface AnalyticsData {
  totalAppointments: number
  totalUsers: number
  totalRevenue: number
  appointmentsByType: { [key: string]: number }
  appointmentsByStatus: { [key: string]: number }
  paymentsByStatus: { [key: string]: number }
  monthlyAppointments: { [key: string]: number }
  monthlyRevenue: { [key: string]: number }
}

export default function AdminAnalyticsPage() {
  const { isAdmin, user } = useAuth()
  const { appointments, users, loading } = useAdminData()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalAppointments: 0,
    totalUsers: 0,
    totalRevenue: 0,
    appointmentsByType: {},
    appointmentsByStatus: {},
    paymentsByStatus: {},
    monthlyAppointments: {},
    monthlyRevenue: {},
  })

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

  useEffect(() => {
    if (appointments.length > 0 || users.length > 0) {
      calculateAnalytics(appointments, users)
    }
  }, [appointments, users])

  const calculateAnalytics = (appointmentsData: Appointment[], usersData: User[]) => {
    const totalAppointments = appointmentsData.length
    const totalUsers = usersData.length
    const totalRevenue = appointmentsData
      .filter((a) => a.paymentStatus === "PAID")
      .reduce((sum, a) => sum + Number.parseFloat(a.payment || "0"), 0)

    // Appointments by type
    const appointmentsByType: { [key: string]: number } = {}
    appointmentsData.forEach((appointment) => {
      const type = appointment.appointmentType || "Unknown"
      appointmentsByType[type] = (appointmentsByType[type] || 0) + 1
    })

    // Appointments by status
    const appointmentsByStatus: { [key: string]: number } = {}
    appointmentsData.forEach((appointment) => {
      const status = appointment.appointmentStatus || "Unknown"
      appointmentsByStatus[status] = (appointmentsByStatus[status] || 0) + 1
    })

    // Payments by status
    const paymentsByStatus: { [key: string]: number } = {}
    appointmentsData.forEach((appointment) => {
      const status = appointment.paymentStatus || "Unknown"
      paymentsByStatus[status] = (paymentsByStatus[status] || 0) + 1
    })

    // Monthly data (last 6 months)
    const monthlyAppointments: { [key: string]: number } = {}
    const monthlyRevenue: { [key: string]: number } = {}

    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      monthlyAppointments[monthKey] = 0
      monthlyRevenue[monthKey] = 0
    }

    appointmentsData.forEach((appointment) => {
      const appointmentDate = new Date(appointment.appointmentDate)
      const monthKey = appointmentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })

      if (monthKey in monthlyAppointments) {
        monthlyAppointments[monthKey]++
        if (appointment.paymentStatus === "PAID") {
          monthlyRevenue[monthKey] += Number.parseFloat(appointment.payment || "0")
        }
      }
    })

    setAnalytics({
      totalAppointments,
      totalUsers,
      totalRevenue,
      appointmentsByType,
      appointmentsByStatus,
      paymentsByStatus,
      monthlyAppointments,
      monthlyRevenue,
    })
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
      case "paid":
        return "bg-green-100 text-green-800"
      case "not_paid":
        return "bg-red-100 text-red-800"
      case "partial":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string, index: number) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
    ]
    return colors[index % colors.length]
  }

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
                  <h1 className="text-xl font-bold text-blue-900">Analytics Dashboard</h1>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Analytics Dashboard</h1>
            <p className="text-xl text-gray-600">Comprehensive insights and statistics</p>
          </div>

          {loading.appointments || loading.users ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading analytics...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card className="border-2 border-gray-100 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                        <p className="text-3xl font-bold text-blue-900">{analytics.totalAppointments}</p>
                        <p className="text-sm text-green-600 flex items-center mt-1">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          Active bookings
                        </p>
                      </div>
                      <Calendar className="h-12 w-12 text-blue-900 opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-100 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-3xl font-bold text-green-700">{analytics.totalUsers}</p>
                        <p className="text-sm text-green-600 flex items-center mt-1">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          Registered users
                        </p>
                      </div>
                      <Users className="h-12 w-12 text-green-700 opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-100 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-purple-700">₱{analytics.totalRevenue.toLocaleString()}</p>
                        <p className="text-sm text-green-600 flex items-center mt-1">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          Paid appointments
                        </p>
                      </div>
                      <DollarSign className="h-12 w-12 text-purple-700 opacity-20" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gray-100 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                        <p className="text-3xl font-bold text-orange-700">
                          {analytics.totalAppointments > 0
                            ? Math.round(
                                ((analytics.appointmentsByStatus.COMPLETED || 0) / analytics.totalAppointments) * 100,
                              )
                            : 0}
                          %
                        </p>
                        <p className="text-sm text-green-600 flex items-center mt-1">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Success rate
                        </p>
                      </div>
                      <Activity className="h-12 w-12 text-orange-700 opacity-20" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Appointments by Type */}
                <Card className="border-2 border-gray-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-2xl">
                      <BarChart3 className="mr-3 h-6 w-6 text-blue-900" />
                      Appointments by Type
                    </CardTitle>
                    <CardDescription>Distribution of appointment types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analytics.appointmentsByType).map(([type, count], index) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge className={getTypeColor(type, index)}>{type.replace(/_/g, " ")}</Badge>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${(count / analytics.totalAppointments) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="font-bold text-gray-900 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Appointments by Status */}
                <Card className="border-2 border-gray-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-2xl">
                      <Clock className="mr-3 h-6 w-6 text-green-700" />
                      Appointments by Status
                    </CardTitle>
                    <CardDescription>Current status distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analytics.appointmentsByStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(status)}>{status.replace(/_/g, " ")}</Badge>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                  width: `${(count / analytics.totalAppointments) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="font-bold text-gray-900 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Analytics */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Payment Status */}
                <Card className="border-2 border-gray-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-2xl">
                      <DollarSign className="mr-3 h-6 w-6 text-purple-700" />
                      Payment Status
                    </CardTitle>
                    <CardDescription>Payment completion overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analytics.paymentsByStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(status)}>{status.replace(/_/g, " ")}</Badge>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{
                                  width: `${(count / analytics.totalAppointments) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="font-bold text-gray-900 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Trends */}
                <Card className="border-2 border-gray-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-2xl">
                      <TrendingUp className="mr-3 h-6 w-6 text-orange-700" />
                      Monthly Trends
                    </CardTitle>
                    <CardDescription>Appointments and revenue over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analytics.monthlyAppointments).map(([month, appointments]) => {
                        const revenue = analytics.monthlyRevenue[month] || 0
                        return (
                          <div key={month} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-700">{month}</span>
                              <div className="text-right">
                                <div className="text-sm font-bold text-gray-900">{appointments} appointments</div>
                                <div className="text-xs text-gray-600">₱{revenue.toLocaleString()} revenue</div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-orange-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.max((appointments / Math.max(...Object.values(analytics.monthlyAppointments))) * 100, 5)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
