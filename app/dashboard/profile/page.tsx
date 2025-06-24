"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { updateUserProfile } from "@/lib/auth"
import ProtectedRoute from "@/components/ProtectedRoute"
import DashboardHeader from "@/components/DashboardHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, Calendar, Save, CheckCircle, AlertCircle, Shield, MapPin } from "lucide-react"

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
    age: "",
    address: "",
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        middleName: profile.middleName || "",
        phone: profile.phone || "",
        age: profile.age?.toString() || "",
        address: profile.address || "",
      })
    }
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (!user) throw new Error("User not found")

      const updates = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName || undefined,
        phone: formData.phone,
        age: formData.age ? Number.parseInt(formData.age) : undefined,
        address: formData.address,
      }

      await updateUserProfile(user.uid, updates)

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 animate-slide-up">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Profile Settings</h1>
              <p className="text-xl text-gray-600">Manage your personal information and account details</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Summary Card */}
              <div className="lg:col-span-1">
                <Card className="border-2 border-gray-100 shadow-lg hover-lift animate-scale-in">
                  <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                    <div className="bg-blue-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 hover-glow transition-all duration-300">
                      <User className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-xl">
                      {profile?.firstName && profile?.lastName
                        ? `${profile.firstName} ${profile.lastName}`
                        : user?.email?.split("@")[0] || "User"}
                    </CardTitle>
                    <CardDescription className="flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      Verified Account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Mail className="mr-3 h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 truncate">{user?.email}</span>
                      </div>
                      {profile?.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="mr-3 h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">{profile.phone}</span>
                        </div>
                      )}
                      {profile?.address && (
                        <div className="flex items-center text-sm">
                          <MapPin className="mr-3 h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">{profile.address}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-3 h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          Member since {profile?.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}
                        </span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-center space-x-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">Secure Account</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Profile Form */}
              <div className="lg:col-span-2">
                <Card
                  className="border-2 border-gray-100 shadow-lg animate-slide-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center text-2xl">
                      <User className="mr-3 h-6 w-6 text-blue-900" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>Update your profile details and contact information</CardDescription>
                  </CardHeader>

                  <CardContent className="p-8">
                    {error && (
                      <Alert className="border-red-200 bg-red-50 mb-6 animate-bounce-in">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">{error}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Email (Read-only) */}
                      <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.3s" }}>
                        <Label htmlFor="email" className="text-gray-700 font-medium">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={user?.email || ""}
                            className="pl-10 h-12 bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed"
                            disabled
                          />
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Email Verified</span>
                        </div>
                      </div>

                      {/* Name Fields */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.4s" }}>
                          <Label htmlFor="firstName" className="text-gray-700 font-medium">
                            First Name *
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                              id="firstName"
                              name="firstName"
                              type="text"
                              placeholder="Enter first name"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="pl-10 h-12 border-gray-300 focus:border-blue-900 focus:ring-blue-900 transition-all duration-300"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.5s" }}>
                          <Label htmlFor="lastName" className="text-gray-700 font-medium">
                            Last Name *
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                              id="lastName"
                              name="lastName"
                              type="text"
                              placeholder="Enter last name"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="pl-10 h-12 border-gray-300 focus:border-blue-900 focus:ring-blue-900 transition-all duration-300"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.6s" }}>
                        <Label htmlFor="middleName" className="text-gray-700 font-medium">
                          Middle Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            id="middleName"
                            name="middleName"
                            type="text"
                            placeholder="Enter middle name (optional)"
                            value={formData.middleName}
                            onChange={handleInputChange}
                            className="pl-10 h-12 border-gray-300 focus:border-blue-900 focus:ring-blue-900 transition-all duration-300"
                          />
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.7s" }}>
                          <Label htmlFor="phone" className="text-gray-700 font-medium">
                            Phone Number
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              placeholder="Enter phone number"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="pl-10 h-12 border-gray-300 focus:border-blue-900 focus:ring-blue-900 transition-all duration-300"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.8s" }}>
                          <Label htmlFor="age" className="text-gray-700 font-medium">
                            Age
                          </Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                              id="age"
                              name="age"
                              type="number"
                              placeholder="Enter age"
                              value={formData.age}
                              onChange={handleInputChange}
                              className="pl-10 h-12 border-gray-300 focus:border-blue-900 focus:ring-blue-900 transition-all duration-300"
                              min="1"
                              max="120"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.9s" }}>
                        <Label htmlFor="address" className="text-gray-700 font-medium">
                          Address
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                          <Input
                            id="address"
                            name="address"
                            type="text"
                            placeholder="Enter your address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="pl-10 h-12 border-gray-300 focus:border-blue-900 focus:ring-blue-900 transition-all duration-300"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-6 border-t border-gray-200 animate-slide-up" style={{ animationDelay: "1s" }}>
                        <Button
                          type="submit"
                          className="w-full bg-blue-900 hover:bg-blue-800 text-white h-12 text-base font-medium shadow-lg hover-lift transition-all duration-300"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Updating Profile...
                            </div>
                          ) : (
                            <>
                              <Save className="mr-2 h-5 w-5" />
                              Update Profile
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
