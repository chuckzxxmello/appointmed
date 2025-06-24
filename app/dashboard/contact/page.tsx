"use client"

import type React from "react"

import { useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import DashboardHeader from "@/components/DashboardHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, AlertCircle, Shield, Headphones } from "lucide-react"
import Image from "next/image"

export default function ContactPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    })

    setFormData({
      name: "",
      email: "",
      subject: "",
      category: "",
      message: "",
    })
    setIsSubmitting(false)
  }

  const contactMethods = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call us for immediate assistance",
      value: "+63 947 429 5648",
      color: "green",
      available: "Mon-Fri 8AM-6PM",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message",
      value: "eladschoolofpotentials@yahoo.com",
      color: "blue",
      available: "24/7 Response",
    },
    {
      icon: MapPin,
      title: "Visit Our Clinic",
      description: "Come see us in person",
      value: "Camerino St. Brgy. Luciano, Trece Martires",
      color: "purple",
      available: "Mon-Fri 8AM-5PM",
    },
  ]

  const faqItems = [
    {
      question: "How do I book an appointment?",
      answer: "You can book appointments through our online calendar system or by calling our clinic directly.",
    },
    {
      question: "What should I bring to my appointment?",
      answer: "Please bring a valid ID, insurance information, and any relevant medical records or referrals.",
    },
    {
      question: "Can I reschedule my appointment?",
      answer: "Yes, you can reschedule through your patient portal or by calling us at least 24 hours in advance.",
    },
    {
      question: "Do you accept insurance?",
      answer: "We accept most major insurance plans. Please contact us to verify your specific coverage.",
    },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12 animate-slide-up">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-900 w-20 h-20 rounded-2xl flex items-center justify-center hover-glow transition-all duration-300">
                <Headphones className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Support</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Need help? We're here to assist you with any questions or concerns about your healthcare journey.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {contactMethods.map((method, index) => (
              <Card
                key={method.title}
                className={`border-2 border-gray-100 hover:shadow-xl transition-all duration-300 hover-lift animate-scale-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8 text-center">
                  <div
                    className={`bg-${method.color}-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 hover-glow transition-all duration-300`}
                  >
                    <method.icon className={`h-8 w-8 text-${method.color}-700`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-gray-600 mb-4">{method.description}</p>
                  <p className="font-medium text-gray-900 mb-2">{method.value}</p>
                  <p className="text-sm text-gray-500">{method.available}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="border-2 border-gray-100 shadow-lg animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <MessageSquare className="mr-3 h-6 w-6 text-blue-900" />
                  Send us a Message
                </CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you soon</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.5s" }}>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.6s" }}>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        className="transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.7s" }}>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="transition-all duration-300 focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appointment">Appointment Help</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.8s" }}>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief description of your inquiry"
                      className="transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.9s" }}>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please provide details about your inquiry..."
                      rows={6}
                      className="transition-all duration-300 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white h-12 text-base font-medium shadow-lg hover-lift transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: "1s" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending Message...
                      </div>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <div className="space-y-8">
              {/* Clinic Info */}
              <Card className="border-2 border-gray-100 shadow-lg animate-slide-up" style={{ animationDelay: "0.5s" }}>
                <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                  <div className="flex justify-center mb-4">
                    <Image
                      src="/apple-touch-icon.png"
                      alt="AppointMED Logo"
                      width={64}
                      height={64}
                      className="rounded-xl shadow-lg"
                    />
                  </div>
                  <CardTitle className="text-xl">ELAD School of Potentials</CardTitle>
                  <CardDescription>Therapy Center</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <MapPin className="mr-3 h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Camerino St. Brgy. Luciano, Trece Martires, Philippines</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="mr-3 h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">+63 947 429 5648</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="mr-3 h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">eladschoolofpotentials@yahoo.com</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-3 h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Monday - Friday: 8:00 AM - 6:00 PM</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Licensed Healthcare Facility</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card className="border-2 border-gray-100 shadow-lg animate-slide-up" style={{ animationDelay: "0.6s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <MessageSquare className="mr-2 h-5 w-5 text-blue-900" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>Quick answers to common questions</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {faqItems.map((faq, index) => (
                      <div
                        key={index}
                        className={`p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 animate-slide-up`}
                        style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                      >
                        <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                        <p className="text-sm text-gray-600">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Emergency Contact */}
          <Card className="border-2 border-red-100 bg-red-50 shadow-lg mt-12 animate-bounce-in">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-red-900 mb-2">Emergency Contact</h3>
              <p className="text-red-800 mb-4">
                For medical emergencies, please call emergency services immediately or visit your nearest emergency
                room.
              </p>
              <p className="text-red-700 font-medium">Emergency Hotline: 911</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
