"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useAdminData } from "@/contexts/AdminDataContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createAnnouncement } from "@/lib/admin"
import { useToast } from "@/hooks/use-toast"
import { Heart, ArrowLeft, MessageSquare, LogOut } from "lucide-react"
import Link from "next/link"
import { signOut } from "@/lib/auth"

export default function CreateAnnouncementPage() {
  const { user, profile, isAdmin } = useAuth()
  const { refreshAnnouncements } = useAdminData()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "info",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      await createAnnouncement(
        formData.title,
        formData.content,
        formData.type,
        `${profile.firstName} ${profile.lastName}`,
      )

      toast({
        title: "Success",
        description: "Announcement created successfully",
      })

      // Refresh announcements data
      await refreshAnnouncements()

      router.push("/admin/announcements")
    } catch (error) {
      console.error("Error creating announcement:", error)
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
                  <h1 className="text-xl font-bold text-blue-900">Create Announcement</h1>
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
                <Link href="/admin/announcements">
                  <Button variant="outline" className="bg-white text-blue-900 border-blue-900 hover:bg-blue-50">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Announcements
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Create New Announcement</h1>
            <p className="text-xl text-gray-600">Share important information with all users</p>
          </div>

          {/* Form */}
          <Card className="max-w-2xl mx-auto border-2 border-gray-100 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <MessageSquare className="mr-3 h-6 w-6 text-blue-900" />
                Announcement Details
              </CardTitle>
              <CardDescription>Fill in the information below to create a new announcement</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter announcement title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select announcement type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Information</SelectItem>
                      <SelectItem value="important">Important</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter announcement content"
                    rows={6}
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-6">
                  <Link href="/admin/announcements">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading} className="bg-blue-900 hover:bg-blue-800 text-white">
                    {loading ? "Creating..." : "Create Announcement"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
