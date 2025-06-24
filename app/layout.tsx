import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AdminDataProvider } from "@/contexts/AdminDataContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AppointMED - Medical Appointment System",
  description: "Professional medical appointment booking and management system",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <AdminDataProvider>
          {children}
          <Toaster />
        </AdminDataProvider>
      </body>
    </html>
  )
}
