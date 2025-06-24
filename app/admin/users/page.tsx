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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { updateUserRole } from "@/lib/admin"
import { useToast } from "@/hooks/use-toast"
import { Heart, Users, Search, Mail, Phone, Calendar, ArrowLeft, Shield, Edit, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  emailVerified: boolean
  createdAt: any
}

export default function AdminUsersPage() {
  const { isAdmin, user } = useAuth()
  const { users, loading, refreshUsers } = useAdminData()
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole)
      toast({
        title: "Success",
        description: "User role updated successfully",
      })
      await refreshUsers()
      setIsEditDialogOpen(false)
      setEditingUser(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>
      case "manager":
        return <Badge className="bg-purple-100 text-purple-800">Manager</Badge>
      default:
        return <Badge className="bg-blue-100 text-blue-800">User</Badge>
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
                  <h1 className="text-xl font-bold text-blue-900">User Management</h1>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-3">User Management</h1>
            <p className="text-xl text-gray-600">Manage all registered users and their information</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-blue-900">{users.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-900" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Verified Users</p>
                    <p className="text-3xl font-bold text-green-700">{users.filter((u) => u.emailVerified).length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-700" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Admin Users</p>
                    <p className="text-3xl font-bold text-red-700">{users.filter((u) => u.role === "admin").length}</p>
                  </div>
                  <Shield className="h-8 w-8 text-red-700" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Regular Users</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {users.filter((u) => u.role === "user").length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-700" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card className="border-2 border-gray-100 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">All Users</CardTitle>
                  <CardDescription>Manage and view all registered users</CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading users...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Mail className="mr-2 h-4 w-4 text-gray-400" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.phone ? (
                              <div className="flex items-center">
                                <Phone className="mr-2 h-4 w-4 text-gray-400" />
                                {user.phone}
                              </div>
                            ) : (
                              <span className="text-gray-400">Not provided</span>
                            )}
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            {user.emailVerified ? (
                              <Badge className="bg-green-100 text-green-800">Verified</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">Unverified</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                              {user.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No users found</h3>
                      <p className="text-gray-500">
                        {searchTerm ? "Try adjusting your search criteria" : "No users have registered yet"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Update the role for {editingUser?.firstName} {editingUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <Select
                value={editingUser?.role || "user"}
                onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdateUserRole(editingUser?.id, editingUser?.role)}
              className="bg-blue-900 hover:bg-blue-800"
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
