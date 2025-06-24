"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
// This direct import is no longer needed
// import { signOut } from "@/lib/auth" 
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, Calendar, FileText, Phone, Menu, X } from "lucide-react"
import Image from "next/image"

export default function DashboardHeader() {
  // Destructure signOut directly from the useAuth hook
  const { user, profile, signOut } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      // This now correctly calls the signOut function provided by the hook
      await signOut()
      toast({
        title: "Signed out successfully",
        description: "You have been securely signed out.",
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

  const navigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: Calendar },
    { href: "/dashboard/calendar", label: "Book Appointment", icon: Calendar },
    { href: "/dashboard/appointments", label: "My Appointments", icon: FileText },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/contact", label: "Contact", icon: Phone },
  ]

  return (
    <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-sm animate-slide-up">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-3 hover-lift transition-all duration-300">
            <div className="relative">
              <Image src="/apple-touch-icon.png" alt="AppointMED Logo" width={32} height={32} className="rounded-lg" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">AppointMED</h1>
              <p className="text-sm text-gray-600">Patient Portal</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-900 transition-colors duration-300 font-medium"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover-lift transition-all duration-300">
                  <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-900" />
                  </div>
                  <span className="hidden md:block text-gray-700">
                    {profile?.firstName || user?.email?.split("@")[0] || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 animate-scale-in">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {profile?.firstName && profile?.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : user?.email?.split("@")[0] || "User"}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile" className="flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/appointments" className="flex items-center cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    My Appointments
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 animate-slide-up">
            <nav className="flex flex-col space-y-2 mt-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-all duration-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}