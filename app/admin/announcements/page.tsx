"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useAdminData } from "@/contexts/AdminDataContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Heart, MessageSquare, Search, Plus, Trash2, ArrowLeft, Calendar, LogOut } from "lucide-react"
import Link from "next/link"
import { deleteAnnouncement } from "@/lib/admin"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  createdBy: string
  createdAt: any
}

export default function AdminAnnouncementsPage() {
  const { isAdmin, user } = useAuth()
  const { announcements, loading, refreshAnnouncements } = useAdminData()
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

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

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return

    try {
      await deleteAnnouncement(announcementId)
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      })
      await refreshAnnouncements()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      })
    }
  }

  const filteredAnnouncements = announcements.filter(
    (announcement) =>
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.createdBy.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>
      case "important":
        return <Badge className="bg-orange-100 text-orange-800">Important</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>
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
                  <h1 className="text-xl font-bold text-blue-900">Announcement Management</h1>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Announcement Management</h1>
            <p className="text-xl text-gray-600">Manage system announcements and notifications</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Announcements</p>
                    <p className="text-3xl font-bold text-blue-900">{announcements.length}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-900" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Urgent</p>
                    <p className="text-3xl font-bold text-red-700">
                      {announcements.filter((a) => a.type === "urgent").length}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-red-700" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Important</p>
                    <p className="text-3xl font-bold text-orange-700">
                      {announcements.filter((a) => a.type === "important").length}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-orange-700" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Information</p>
                    <p className="text-3xl font-bold text-green-700">
                      {announcements.filter((a) => a.type === "info").length}
                    </p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-700" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Announcements Table */}
          <Card className="border-2 border-gray-100 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">All Announcements</CardTitle>
                  <CardDescription>Manage and view all system announcements</CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search announcements..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Link href="/admin/announcements/create">
                    <Button className="bg-blue-900 hover:bg-blue-800 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Announcement
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading.announcements ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading announcements...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Content Preview</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAnnouncements.map((announcement) => (
                        <TableRow key={announcement.id}>
                          <TableCell className="font-medium max-w-xs">
                            <div className="truncate">{announcement.title}</div>
                          </TableCell>
                          <TableCell>{getTypeBadge(announcement.type)}</TableCell>
                          <TableCell className="max-w-md">
                            <div className="truncate text-gray-600">{announcement.content}</div>
                          </TableCell>
                          <TableCell>{announcement.createdBy}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                              {announcement.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAnnouncement(announcement.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredAnnouncements.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No announcements found</h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? "Try adjusting your search criteria" : "No announcements have been created yet"}
                      </p>
                      {!searchTerm && (
                        <Link href="/admin/announcements/create">
                          <Button className="bg-blue-900 hover:bg-blue-800 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Announcement
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
