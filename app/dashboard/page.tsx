"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, User, FileText, Phone, CheckCircle, TrendingUp, LogOut, Settings, ChevronDown, Menu, X } from "lucide-react"
import Link from "next/link"

// Working Dashboard Header Component with Logout Dropdown
function DashboardHeader() {
  const { user, profile, signOut } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      setIsDropdownOpen(false)
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleProfileClick = () => {
    setIsDropdownOpen(false)
    router.push('/dashboard/profile')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-900">
              AppointMED
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/dashboard/calendar" 
              className="text-gray-600 hover:text-blue-900 transition-colors duration-200"
            >
              Calendar
            </Link>
            <Link 
              href="/dashboard/appointments" 
              className="text-gray-600 hover:text-blue-900 transition-colors duration-200"
            >
              Appointments
            </Link>
            <Link 
              href="/dashboard/contact" 
              className="text-gray-600 hover:text-blue-900 transition-colors duration-200"
            >
              Support
            </Link>
          </nav>

          {/* User Dropdown */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-900 hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:block max-w-32 truncate">
                  {profile?.firstName || user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in-0 slide-in-from-top-2">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile?.firstName && profile?.lastName 
                        ? `${profile.firstName} ${profile.lastName}`
                        : profile?.firstName || 'User'
                      }
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={handleProfileClick}
                      className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Settings className="w-4 h-4 mr-3 text-gray-400" />
                      Profile Settings
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              <Link 
                href="/dashboard/calendar" 
                className="px-4 py-2 text-gray-600 hover:text-blue-900 hover:bg-gray-50 rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Calendar
              </Link>
              <Link 
                href="/dashboard/appointments" 
                className="px-4 py-2 text-gray-600 hover:text-blue-900 hover:bg-gray-50 rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Appointments
              </Link>
              <Link 
                href="/dashboard/contact" 
                className="px-4 py-2 text-gray-600 hover:text-blue-900 hover:bg-gray-50 rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Support
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default function Dashboard() {
  const { user, profile, isAdmin, loading } = useAuth()
  const router = useRouter()

  // Redirect admin users to admin panel
  useEffect(() => {
    if (!loading && isAdmin) {
      console.log("Admin user detected, redirecting to admin panel")
      router.push("/admin")
      return
    }
  }, [isAdmin, loading, router])

  // Don't render dashboard for admin users
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (isAdmin) {
    return null // Will redirect to admin panel
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />

        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8 animate-slide-up">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Welcome back, {profile?.firstName || user?.email?.split("@")[0] || "User"}!
            </h1>
            <p className="text-xl text-gray-600">Manage your appointments and health information with AppointMED.</p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              {
                title: "Book Appointment",
                description: "Schedule a new appointment",
                icon: Calendar,
                href: "/dashboard/calendar",
                color: "blue",
              },
              {
                title: "My Appointments",
                description: "View your appointments",
                icon: FileText,
                href: "/dashboard/appointments",
                color: "green",
              },
              {
                title: "Profile Settings",
                description: "Update your information",
                icon: User,
                href: "/dashboard/profile",
                color: "purple",
              },
              {
                title: "Contact Support",
                description: "Get help and support",
                icon: Phone,
                href: "/dashboard/contact",
                color: "orange",
              },
            ].map((action, index) => (
              <Link key={action.title} href={action.href}>
                <Card
                  className={`border-2 border-gray-100 hover:shadow-lg transition-all duration-300 hover-lift cursor-pointer animate-scale-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`bg-${action.color}-50 w-12 h-12 rounded-xl flex items-center justify-center`}>
                        <action.icon className={`h-6 w-6 text-${action.color}-700`} />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Health Tips */}
          <Card className="border-2 border-gray-100 shadow-lg animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <TrendingUp className="mr-2 h-6 w-6 text-blue-900" />
                Health Tips
              </CardTitle>
              <CardDescription>Stay healthy with these daily reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Stay Hydrated</h4>
                      <p className="text-sm text-gray-600">Drink at least 8 glasses of water daily</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Regular Exercise</h4>
                      <p className="text-sm text-gray-600">30 minutes of activity daily keeps you healthy</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Balanced Diet</h4>
                      <p className="text-sm text-gray-600">Include fruits and vegetables in every meal</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Quality Sleep</h4>
                      <p className="text-sm text-gray-600">Get 7-9 hours of sleep each night</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}