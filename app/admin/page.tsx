"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useAdminData } from "@/contexts/AdminDataContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import NotificationSystem from "@/components/NotificationSystem"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Calendar,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const { users, appointments, announcements, loading, error, refreshAll } = useAdminData()
  const { toast } = useToast()
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  const handleRefreshAll = async () => {
    setIsRefreshing(true)
    try {
      await refreshAll()
      toast({
        title: "Data refreshed",
        description: "All admin data has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    totalAppointments: appointments.length,
    pendingAppointments: appointments.filter((apt) => apt.appointmentStatus === "PENDING").length,
    confirmedAppointments: appointments.filter((apt) => apt.appointmentStatus === "CONFIRMED").length,
    completedAppointments: appointments.filter(
      (apt) => apt.appointmentStatus === "COMPLETED" || apt.appointmentStatus === "FINISHED",
    ).length,
    totalRevenue: appointments
      .filter((apt) => apt.paymentStatus === "PAID")
      .reduce((sum, apt) => sum + Number.parseFloat(apt.payment || "0"), 0),
    totalAnnouncements: announcements.length,
    recentAnnouncements: announcements.filter((ann) => {
      const createdAt = ann.createdAt?.toDate?.() || new Date(ann.createdAt)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return createdAt > oneDayAgo
    }).length,
  }

  const hasErrors = error.users || error.appointments || error.announcements
  const isLoading = loading.users || loading.appointments || loading.announcements

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Image
                    src="/apple-touch-icon.png"
                    alt="AppointMED Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                    <Settings className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-blue-900">AppointMED Admin</h1>
                  <p className="text-sm text-gray-600 font-medium">Administrative Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationSystem />
                <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
                <Button
                  variant="outline"
                  onClick={handleRefreshAll}
                  disabled={isRefreshing}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Admin Dashboard</h1>
            <p className="text-xl text-gray-600">
              Manage users, appointments, and system announcements for AppointMED.
            </p>
          </div>

          {/* Error Alerts */}
          {hasErrors && (
            <div className="mb-6 space-y-2">
              {error.users && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">Users Error: {error.users}</AlertDescription>
                </Alert>
              )}
              {error.appointments && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">Appointments Error: {error.appointments}</AlertDescription>
                </Alert>
              )}
              {error.announcements && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Announcements Error: {error.announcements}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 border-gray-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-900" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                    <p className="text-3xl font-bold text-green-700">{stats.totalAppointments}</p>
                  </div>
                  <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Appointments</p>
                    <p className="text-3xl font-bold text-yellow-700">{stats.pendingAppointments}</p>
                  </div>
                  <div className="bg-yellow-50 w-12 h-12 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-purple-700">₱{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-2 border-gray-100 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Settings className="mr-3 h-6 w-6 text-blue-900" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-lg">Manage your system efficiently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/admin/users">
                  <Button className="w-full bg-blue-900 hover:bg-blue-800 text-white justify-start h-14 text-base">
                    <Users className="mr-3 h-5 w-5" />
                    Manage Users
                    <Badge className="ml-auto bg-blue-700">{stats.totalUsers}</Badge>
                  </Button>
                </Link>
                <Link href="/admin/appointments">
                  <Button
                    variant="outline"
                    className="w-full bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50 justify-start h-14 text-base"
                  >
                    <Calendar className="mr-3 h-5 w-5" />
                    Appointments
                    <Badge className="ml-auto bg-blue-100 text-blue-900">{stats.totalAppointments}</Badge>
                  </Button>
                </Link>
                <Link href="/admin/announcements">
                  <Button
                    variant="outline"
                    className="w-full bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50 justify-start h-14 text-base"
                  >
                    <MessageSquare className="mr-3 h-5 w-5" />
                    Announcements
                    <Badge className="ml-auto bg-blue-100 text-blue-900">{stats.totalAnnouncements}</Badge>
                  </Button>
                </Link>
                <Link href="/admin/calendar">
                  <Button
                    variant="outline"
                    className="w-full bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50 justify-start h-14 text-base"
                  >
                    <Calendar className="mr-3 h-5 w-5" />
                    Calendar View
                  </Button>
                </Link>
                <Link href="/admin/analytics">
                  <Button
                    variant="outline"
                    className="w-full bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50 justify-start h-14 text-base"
                  >
                    <BarChart3 className="mr-3 h-5 w-5" />
                    Analytics
                  </Button>
                </Link>
                <Link href="/admin/announcements/create">
                  <Button
                    variant="outline"
                    className="w-full bg-white text-green-700 border-2 border-green-700 hover:bg-green-50 justify-start h-14 text-base"
                  >
                    <MessageSquare className="mr-3 h-5 w-5" />
                    Create Announcement
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Appointments */}
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Calendar className="mr-2 h-5 w-5 text-blue-900" />
                  Recent Appointments
                </CardTitle>
                <CardDescription>Latest appointment activities</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.slice(0, 5).map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {appointment.firstName} {appointment.surname}
                          </h4>
                          <p className="text-sm text-gray-600">{appointment.appointmentType}</p>
                          <p className="text-xs text-gray-500">
                            {appointment.appointmentDate
                              ? new Date(appointment.appointmentDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              appointment.appointmentStatus === "CONFIRMED"
                                ? "bg-green-100 text-green-800"
                                : appointment.appointmentStatus === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }
                          >
                            {appointment.appointmentStatus}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">₱{appointment.payment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No appointments found</p>
                  </div>
                )}

                {appointments.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link href="/admin/appointments">
                      <Button variant="outline" className="text-blue-900 border-blue-900 hover:bg-blue-50">
                        View All Appointments
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Announcements */}
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <MessageSquare className="mr-2 h-5 w-5 text-blue-900" />
                  Recent Announcements
                </CardTitle>
                <CardDescription>Latest system announcements</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.slice(0, 3).map((announcement) => (
                      <div
                        key={announcement.id}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                          <Badge
                            className={
                              announcement.type === "important"
                                ? "bg-red-100 text-red-800"
                                : announcement.type === "urgent"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                            }
                          >
                            {announcement.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{announcement.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {announcement.createdAt?.toDate?.()?.toLocaleDateString() || "Recent"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No announcements found</p>
                  </div>
                )}

                <div className="mt-4 text-center space-x-2">
                  <Link href="/admin/announcements">
                    <Button variant="outline" className="text-blue-900 border-blue-900 hover:bg-blue-50">
                      View All
                    </Button>
                  </Link>
                  <Link href="/admin/announcements/create">
                    <Button className="bg-blue-900 hover:bg-blue-800 text-white">Create New</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card className="border-2 border-gray-100 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <TrendingUp className="mr-2 h-5 w-5 text-blue-900" />
                System Status
              </CardTitle>
              <CardDescription>Current system health and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.confirmedAppointments}</div>
                  <p className="text-sm text-gray-600">Confirmed Appointments</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingAppointments}</div>
                  <p className="text-sm text-gray-600">Pending Appointments</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.completedAppointments}</div>
                  <p className="text-sm text-gray-600">Completed Appointments</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Data last updated:</span>
                  <span className="text-gray-900 font-medium">{new Date().toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
