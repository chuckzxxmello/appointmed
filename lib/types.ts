export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  middleName?: string
  phone: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Appointment {
  id: string
  userId: string
  appointmentDate: string
  appointmentTimeStart: string
  appointmentTimeEnd: string
  appointmentType: string
  appointmentStatus: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
  doctor: string
  contact: string
  email: string
  firstName: string
  middleName?: string
  surname: string
  payment: string
  paymentStatus: "PAID" | "NOT_PAID" | "PARTIAL"
  paymentType: "CASH" | "BANK_TRANSFER" | "CARD"
  createdAt: Date
  updatedAt: Date
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: "info" | "important" | "urgent"
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: "admin" | "manager"
  permissions: string[]
  lastLogin?: Date
  createdAt: Date
}

export interface Service {
  id: string
  name: string
  description: string
  duration: number // in minutes
  category: "major" | "minor"
  price: number
  isActive: boolean
}

export interface Doctor {
  id: string
  name: string
  specialization: string
  email: string
  phone: string
  isActive: boolean
  schedule: {
    [key: string]: {
      // day of week
      start: string
      end: string
      isAvailable: boolean
    }
  }
}
