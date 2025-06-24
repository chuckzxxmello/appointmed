"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useAdminData } from "@/contexts/AdminDataContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createAppointment, updateAppointment, deleteAppointment } from "@/lib/admin"
import { useToast } from "@/hooks/use-toast"
import {
  Heart,
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Clock,
  User,
  DollarSign,
  LogOut,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"

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
  paymentType: string
  createdAt: any
}

const initialFormData = {
  appointmentDate: "",
  appointmentTimeStart: "",
  appointmentTimeEnd: "",
  appointmentType: "",
  appointmentStatus: "PENDING",
  doctor: "",
  contact: "",
  email: "",
  firstName: "",
  middleName: "",
  surname: "",
  payment: "",
  paymentStatus: "NOT_PAID",
  paymentType: "CASH",
}

export default function AdminAppointmentsPage() {
  const { isAdmin, user } = useAuth()
  const { appointments, loading, error, refreshAppointments } = useAdminData()
  const { toast } = useToast()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.firstName.trim()) errors.firstName = "First name is required"
    if (!formData.surname.trim()) errors.surname = "Last name is required"
    if (!formData.email.trim()) errors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid"
    if (!formData.contact.trim()) errors.contact = "Contact number is required"
    if (!formData.appointmentDate) errors.appointmentDate = "Appointment date is required"
    if (!formData.appointmentTimeStart) errors.appointmentTimeStart = "Start time is required"
    if (!formData.appointmentTimeEnd) errors.appointmentTimeEnd = "End time is required"
    if (!formData.appointmentType) errors.appointmentType = "Appointment type is required"
    if (!formData.doctor.trim()) errors.doctor = "Doctor name is required"
    if (!formData.payment.trim()) errors.payment = "Payment amount is required"
    else if (isNaN(Number(formData.payment)) || Number(formData.payment) < 0) {
      errors.payment = "Payment must be a valid positive number"
    }

    // Validate time range
    if (formData.appointmentTimeStart && formData.appointmentTimeEnd) {
      if (formData.appointmentTimeStart >= formData.appointmentTimeEnd) {
        errors.appointmentTimeEnd = "End time must be after start time"
      }
    }

    // Validate date is not in the past
    if (formData.appointmentDate) {
      const selectedDate = new Date(formData.appointmentDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        errors.appointmentDate = "Appointment date cannot be in the past"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateAppointment = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      console.log("Creating appointment with data:", formData)
      await createAppointment(formData)
      toast({
        title: "Success",
        description: "Appointment created successfully",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      await refreshAppointments()
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateAppointment = async () => {
    if (!editingAppointment || !validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      console.log("Updating appointment:", editingAppointment.id, formData)
      await updateAppointment(editingAppointment.id, formData)
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      })
      setIsEditDialogOpen(false)
      setEditingAppointment(null)
      resetForm()
      await refreshAppointments()
    } catch (error) {
      console.error("Error updating appointment:", error)
      toast({
        title: "Error",
        description: "Failed to update appointment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to delete this appointment? This action cannot be undone.")) return

    try {
      console.log("Deleting appointment:", appointmentId)
      await deleteAppointment(appointmentId)
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      })
      await refreshAppointments()
    } catch (error) {
      console.error("Error deleting appointment:", error)
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setFormErrors({})
  }

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setFormData({
      appointmentDate: appointment.appointmentDate,
      appointmentTimeStart: appointment.appointmentTimeStart,
      appointmentTimeEnd: appointment.appointmentTimeEnd,
      appointmentType: appointment.appointmentType,
      appointmentStatus: appointment.appointmentStatus,
      doctor: appointment.doctor,
      contact: appointment.contact,
      email: appointment.email,
      firstName: appointment.firstName,
      middleName: appointment.middleName || "",
      surname: appointment.surname,
      payment: appointment.payment,
      paymentStatus: appointment.paymentStatus,
      paymentType: appointment.paymentType,
    })
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.appointmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctor?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || appointment.appointmentStatus?.toLowerCase() === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "completed":
      case "finished":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || "Unknown"}</Badge>
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>
      case "NOT_PAID":
        return <Badge className="bg-red-100 text-red-800">Not Paid</Badge>
      case "PARTIAL":
        return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status || "Unknown"}</Badge>
    }
  }

  const FormField = ({
    id,
    label,
    type = "text",
    value,
    onChange,
    error,
    required = false,
    children,
  }: {
    id: string
    label: string
    type?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    error?: string
    required?: boolean
    children?: React.ReactNode
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className={required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""}>
        {label}
      </Label>
      {children || (
        <Input id={id} type={type} value={value} onChange={onChange} className={error ? "border-red-500" : ""} />
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )

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
                  <h1 className="text-xl font-bold text-blue-900">Appointment Management</h1>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Appointment Management</h1>
            <p className="text-xl text-gray-600">Manage all appointments and scheduling</p>
          </div>

          {/* Error Alert */}
          {error.appointments && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error.appointments}
                <Button variant="outline" size="sm" onClick={refreshAppointments} className="ml-2 h-6 text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                    <p className="text-3xl font-bold text-blue-900">{appointments.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-900" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-yellow-700">
                      {appointments.filter((a) => a.appointmentStatus === "PENDING").length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-700" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Confirmed</p>
                    <p className="text-3xl font-bold text-green-700">
                      {appointments.filter((a) => a.appointmentStatus === "CONFIRMED").length}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-green-700" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-3xl font-bold text-purple-700">
                      ₱
                      {appointments
                        .filter((a) => a.paymentStatus === "PAID")
                        .reduce((sum, a) => sum + Number.parseFloat(a.payment || "0"), 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-700" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments Table */}
          <Card className="border-2 border-gray-100 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">All Appointments</CardTitle>
                  <CardDescription>Manage and view all appointments</CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search appointments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="finished">Finished</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={refreshAppointments} variant="outline" disabled={loading.appointments}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading.appointments ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={openCreateDialog} className="bg-blue-900 hover:bg-blue-800 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Appointment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Appointment</DialogTitle>
                        <DialogDescription>Fill in the details to create a new appointment</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          id="firstName"
                          label="First Name"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          error={formErrors.firstName}
                          required
                        />
                        <FormField
                          id="surname"
                          label="Last Name"
                          value={formData.surname}
                          onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                          error={formErrors.surname}
                          required
                        />
                        <FormField
                          id="email"
                          label="Email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          error={formErrors.email}
                          required
                        />
                        <FormField
                          id="contact"
                          label="Contact"
                          value={formData.contact}
                          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                          error={formErrors.contact}
                          required
                        />
                        <FormField
                          id="appointmentDate"
                          label="Date"
                          type="date"
                          value={formData.appointmentDate}
                          onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                          error={formErrors.appointmentDate}
                          required
                        />
                        <FormField
                          id="appointmentTimeStart"
                          label="Start Time"
                          type="time"
                          value={formData.appointmentTimeStart}
                          onChange={(e) => setFormData({ ...formData, appointmentTimeStart: e.target.value })}
                          error={formErrors.appointmentTimeStart}
                          required
                        />
                        <FormField
                          id="appointmentTimeEnd"
                          label="End Time"
                          type="time"
                          value={formData.appointmentTimeEnd}
                          onChange={(e) => setFormData({ ...formData, appointmentTimeEnd: e.target.value })}
                          error={formErrors.appointmentTimeEnd}
                          required
                        />
                        <FormField id="appointmentType" label="Type" error={formErrors.appointmentType} required>
                          <Select
                            value={formData.appointmentType}
                            onValueChange={(value) => setFormData({ ...formData, appointmentType: value })}
                          >
                            <SelectTrigger className={formErrors.appointmentType ? "border-red-500" : ""}>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CONSULTATION">Consultation</SelectItem>
                              <SelectItem value="PHYSICAL_THERAPY">Physical Therapy</SelectItem>
                              <SelectItem value="OCCUPATIONAL_THERAPY">Occupational Therapy</SelectItem>
                              <SelectItem value="SPEECH_THERAPY">Speech Therapy</SelectItem>
                              <SelectItem value="MENTAL_HEALTH">Mental Health</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField
                          id="doctor"
                          label="Doctor"
                          value={formData.doctor}
                          onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                          error={formErrors.doctor}
                          required
                        />
                        <FormField
                          id="payment"
                          label="Payment Amount"
                          type="number"
                          value={formData.payment}
                          onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                          error={formErrors.payment}
                          required
                        />
                        <FormField id="appointmentStatus" label="Status">
                          <Select
                            value={formData.appointmentStatus}
                            onValueChange={(value) => setFormData({ ...formData, appointmentStatus: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="FINISHED">Finished</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField id="paymentStatus" label="Payment Status">
                          <Select
                            value={formData.paymentStatus}
                            onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NOT_PAID">Not Paid</SelectItem>
                              <SelectItem value="PAID">Paid</SelectItem>
                              <SelectItem value="PARTIAL">Partial</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateAppointment}
                          className="bg-blue-900 hover:bg-blue-800"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Appointment"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading.appointments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading appointments...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>
                                {appointment.firstName} {appointment.surname}
                              </p>
                              <p className="text-sm text-gray-500">{appointment.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>
                                {appointment.appointmentDate
                                  ? new Date(appointment.appointmentDate).toLocaleDateString()
                                  : "N/A"}
                              </p>
                              <p className="text-sm text-gray-500">
                                {appointment.appointmentTimeStart} - {appointment.appointmentTimeEnd}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{appointment.appointmentType}</TableCell>
                          <TableCell>{appointment.doctor}</TableCell>
                          <TableCell>{getStatusBadge(appointment.appointmentStatus)}</TableCell>
                          <TableCell>
                            <div>
                              <p>₱{appointment.payment}</p>
                              {getPaymentBadge(appointment.paymentStatus)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" onClick={() => openEditDialog(appointment)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAppointment(appointment.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredAppointments.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No appointments found</h3>
                      <p className="text-gray-500">
                        {searchTerm || statusFilter !== "all"
                          ? "Try adjusting your search criteria"
                          : "No appointments have been scheduled yet"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Appointment</DialogTitle>
                <DialogDescription>Update the appointment details</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  id="edit-firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  error={formErrors.firstName}
                  required
                />
                <FormField
                  id="edit-surname"
                  label="Last Name"
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  error={formErrors.surname}
                  required
                />
                <FormField
                  id="edit-email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={formErrors.email}
                  required
                />
                <FormField
                  id="edit-contact"
                  label="Contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  error={formErrors.contact}
                  required
                />
                <FormField
                  id="edit-appointmentDate"
                  label="Date"
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  error={formErrors.appointmentDate}
                  required
                />
                <FormField
                  id="edit-appointmentTimeStart"
                  label="Start Time"
                  type="time"
                  value={formData.appointmentTimeStart}
                  onChange={(e) => setFormData({ ...formData, appointmentTimeStart: e.target.value })}
                  error={formErrors.appointmentTimeStart}
                  required
                />
                <FormField
                  id="edit-appointmentTimeEnd"
                  label="End Time"
                  type="time"
                  value={formData.appointmentTimeEnd}
                  onChange={(e) => setFormData({ ...formData, appointmentTimeEnd: e.target.value })}
                  error={formErrors.appointmentTimeEnd}
                  required
                />
                <FormField id="edit-appointmentType" label="Type" error={formErrors.appointmentType} required>
                  <Select
                    value={formData.appointmentType}
                    onValueChange={(value) => setFormData({ ...formData, appointmentType: value })}
                  >
                    <SelectTrigger className={formErrors.appointmentType ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONSULTATION">Consultation</SelectItem>
                      <SelectItem value="PHYSICAL_THERAPY">Physical Therapy</SelectItem>
                      <SelectItem value="OCCUPATIONAL_THERAPY">Occupational Therapy</SelectItem>
                      <SelectItem value="SPEECH_THERAPY">Speech Therapy</SelectItem>
                      <SelectItem value="MENTAL_HEALTH">Mental Health</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField
                  id="edit-doctor"
                  label="Doctor"
                  value={formData.doctor}
                  onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                  error={formErrors.doctor}
                  required
                />
                <FormField
                  id="edit-payment"
                  label="Payment Amount"
                  type="number"
                  value={formData.payment}
                  onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                  error={formErrors.payment}
                  required
                />
                <FormField id="edit-appointmentStatus" label="Status">
                  <Select
                    value={formData.appointmentStatus}
                    onValueChange={(value) => setFormData({ ...formData, appointmentStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="FINISHED">Finished</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField id="edit-paymentStatus" label="Payment Status">
                  <Select
                    value={formData.paymentStatus}
                    onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_PAID">Not Paid</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PARTIAL">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateAppointment}
                  className="bg-blue-900 hover:bg-blue-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Appointment"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
}
