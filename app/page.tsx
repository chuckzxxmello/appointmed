"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import {
  Calendar,
  Shield,
  Users,
  Clock,
  Brain,
  MessageSquare,
  Activity,
  Star,
  CheckCircle,
  Award,
  Phone,
  Mail,
  MapPin,
  Heart,
} from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  const { user, loading, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Check if user is admin and redirect to admin panel
      if (profile?.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [user, loading, profile, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AppointMED...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50 animate-slide-up">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 animate-slide-in-left">
            <div className="relative">
              <Image src="/apple-touch-icon.png" alt="AppointMED Logo" width={40} height={40} className="rounded-lg" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-900">AppointMED</h1>
              <p className="text-sm text-gray-600 font-medium">ELAD School of Potentials</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 animate-slide-in-right">
            <a href="#services" className="text-gray-700 hover:text-blue-900 transition-colors font-medium">
              Services
            </a>
            <a href="#about" className="text-gray-700 hover:text-blue-900 transition-colors font-medium">
              About
            </a>
            <a href="#contact" className="text-gray-700 hover:text-blue-900 transition-colors font-medium">
              Contact
            </a>
          </nav>

          <div className="flex items-center space-x-3 animate-slide-in-right">
            <Link href="/auth/signin">
              <Button
                variant="outline"
                className="bg-white text-blue-900 border-blue-900 hover:bg-blue-50 font-medium transition-all duration-300"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-blue-900 hover:bg-blue-800 text-white font-medium shadow-lg transition-all duration-300 hover-lift">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="flex justify-center mb-8 animate-bounce-in">
            <Badge className="mb-6 bg-blue-100 text-blue-900 hover:bg-blue-100 px-4 py-2 text-sm font-medium">
              <Award className="mr-2 h-4 w-4" />
              Professional Therapy Services Since 2020
            </Badge>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight animate-slide-up">
            ELAD School of{" "}
            <span className="text-blue-900 relative">
              Potentials
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-200 rounded-full"></div>
            </span>
          </h1>

          <h2
            className="text-2xl md:text-3xl font-semibold text-blue-900 mb-6 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            Therapy Center
          </h2>

          <p
            className="text-xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            Comprehensive therapeutic services including Physical Therapy, Occupational Therapy, Speech & Language
            Therapy, and Mental Health Counseling. Experience professional healthcare with our advanced appointment
            scheduling system.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-6 justify-center mb-12 animate-slide-up"
            style={{ animationDelay: "0.6s" }}
          >
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-blue-900 hover:bg-blue-800 text-white px-10 py-4 text-lg font-medium shadow-xl hover-lift transition-all duration-300"
              >
                <Calendar className="mr-3 h-6 w-6" />
                Book Appointment Now
              </Button>
            </Link>
            <a href="#services">
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50 px-10 py-4 text-lg font-medium transition-all duration-300"
              >
                <Heart className="mr-3 h-6 w-6" />
                Explore Services
              </Button>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { icon: Shield, title: "Secure & Private", desc: "HIPAA compliant data protection", color: "green" },
              { icon: Users, title: "Expert Therapists", desc: "Licensed professionals", color: "blue" },
              { icon: Star, title: "5-Star Rated", desc: "Excellent patient care", color: "purple" },
            ].map((item, index) => (
              <div
                key={item.title}
                className={`text-center stagger-item animate-scale-in`}
                style={{ animationDelay: `${0.8 + index * 0.1}s` }}
              >
                <div
                  className={`bg-${item.color}-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 hover-glow transition-all duration-300`}
                >
                  <item.icon className={`h-8 w-8 text-${item.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose AppointMED?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our advanced scheduling system combines security, convenience, and professional healthcare management in
              one comprehensive platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Advanced Security",
                desc: "Enterprise-grade encryption, secure authentication, and HIPAA-compliant data protection for your peace of mind.",
                color: "blue",
              },
              {
                icon: Clock,
                title: "Real-time Scheduling",
                desc: "Live calendar updates with instant booking confirmation, conflict prevention, and automated reminders.",
                color: "green",
              },
              {
                icon: Users,
                title: "User-Friendly Design",
                desc: "Intuitive interface designed for patients, guardians, and healthcare providers with accessibility in mind.",
                color: "purple",
              },
              {
                icon: Activity,
                title: "Smart Notifications",
                desc: "Automated appointment reminders, status updates, and important announcements via email and in-app notifications.",
                color: "orange",
              },
            ].map((feature, index) => (
              <Card
                key={feature.title}
                className={`border-2 border-gray-100 hover:border-${feature.color}-200 hover:shadow-xl transition-all duration-300 group hover-lift stagger-item animate-scale-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="text-center pb-4">
                  <div
                    className={`bg-${feature.color}-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-${feature.color}-100 transition-colors duration-300`}
                  >
                    <feature.icon className={`h-10 w-10 text-${feature.color}-700`} />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Comprehensive Therapy Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional therapeutic care tailored to your individual needs and goals, delivered by licensed and
              experienced healthcare professionals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Activity,
                title: "Physical Therapy",
                desc: "Comprehensive rehabilitation and movement therapy to restore function, reduce pain, and improve mobility for patients of all ages.",
                color: "blue",
              },
              {
                icon: Users,
                title: "Occupational Therapy",
                desc: "Help patients develop, recover, and improve daily living skills and work-related abilities through specialized therapeutic interventions.",
                color: "green",
              },
              {
                icon: MessageSquare,
                title: "Speech & Language Therapy",
                desc: "Professional treatment for communication disorders, language development support, and speech improvement programs.",
                color: "purple",
              },
              {
                icon: Brain,
                title: "Mental Health Counseling",
                desc: "Professional psychological support, therapeutic counseling, and mental health services in a safe and confidential environment.",
                color: "indigo",
              },
              {
                icon: Heart,
                title: "Rehabilitation Services",
                desc: "Comprehensive recovery programs for various conditions, injuries, and disabilities with personalized treatment plans.",
                color: "red",
              },
              {
                icon: Star,
                title: "Specialized Programs",
                desc: "Customized therapeutic programs designed for specific needs, conditions, and specialized treatment requirements.",
                color: "yellow",
              },
            ].map((service, index) => (
              <Card
                key={service.title}
                className={`bg-white border-2 border-gray-100 hover:border-${service.color}-200 hover:shadow-xl transition-all duration-300 group hover-lift stagger-item animate-scale-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center mb-4">
                    <div
                      className={`bg-${service.color}-50 w-12 h-12 rounded-xl flex items-center justify-center mr-4 group-hover:bg-${service.color}-100 transition-colors duration-300`}
                    >
                      <service.icon className={`h-6 w-6 text-${service.color}-700`} />
                    </div>
                    <div>
                      <CardTitle className="text-blue-900 text-lg">{service.title}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        Major Service
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-gray-600 leading-relaxed">{service.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Get in Touch</h2>
            <p className="text-xl text-gray-600">
              Contact ELAD School of Potentials Therapy Center for professional healthcare services
            </p>
          </div>

          <Card className="border-2 border-gray-100 shadow-xl hover-lift animate-scale-in">
            <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-900 w-16 h-16 rounded-2xl flex items-center justify-center">
                  <Image
                    src="/apple-touch-icon.png"
                    alt="AppointMED Logo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                </div>
              </div>
              <CardTitle className="text-3xl text-blue-900 mb-2">ELAD School of Potentials Therapy Center</CardTitle>
              <CardDescription className="text-lg text-gray-700">
                Professional Healthcare & Therapeutic Services
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6 animate-slide-in-left">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                      <MapPin className="mr-2 h-5 w-5 text-blue-900" />
                      Location
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg hover-glow transition-all duration-300">
                      <p className="text-gray-700 leading-relaxed">
                        Camerino St. Brgy. Luciano,
                        <br />
                        Trece Martires, Philippines, 4109
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 animate-slide-in-right">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Contact Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center bg-gray-50 p-4 rounded-lg hover-glow transition-all duration-300">
                        <Mail className="mr-3 h-5 w-5 text-blue-900" />
                        <div>
                          <p className="font-medium text-gray-900">Email</p>
                          <p className="text-gray-700">eladschoolofpotentials@yahoo.com</p>
                        </div>
                      </div>
                      <div className="flex items-center bg-gray-50 p-4 rounded-lg hover-glow transition-all duration-300">
                        <Phone className="mr-3 h-5 w-5 text-blue-900" />
                        <div>
                          <p className="font-medium text-gray-900">Phone</p>
                          <p className="text-gray-700">+63 947 429 5648</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-6 border-t border-gray-200 animate-bounce-in">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="bg-blue-900 hover:bg-blue-800 text-white px-12 py-4 text-lg font-medium shadow-xl hover-lift transition-all duration-300"
                  >
                    <Calendar className="mr-3 h-6 w-6" />
                    Schedule Your Appointment Today
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 mt-4">
                  Join hundreds of satisfied patients who trust our professional care
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12 px-4 animate-fade-in">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Image src="/apple-touch-icon.png" alt="AppointMED Logo" width={32} height={32} className="rounded-lg" />
              <div>
                <span className="text-2xl font-bold">AppointMED</span>
                <p className="text-blue-200 text-sm">Professional Healthcare Scheduling</p>
              </div>
            </div>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              ELAD School of Potentials Therapy Center - Providing comprehensive therapeutic services with advanced
              appointment management technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {[
              { icon: Shield, title: "Secure & Private", desc: "HIPAA compliant data protection" },
              { icon: Clock, title: "24/7 Access", desc: "Schedule appointments anytime" },
              { icon: Users, title: "Expert Care", desc: "Licensed healthcare professionals" },
            ].map((item, index) => (
              <div
                key={item.title}
                className={`text-center stagger-item animate-fade-in`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <item.icon className="h-8 w-8 mx-auto mb-2 text-blue-200" />
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-blue-200 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center pt-8 border-t border-blue-800">
            <p className="text-blue-200 text-sm">
              © 2025 AppointMED - ELAD School of Potentials Therapy Center. All rights reserved.
            </p>
            <p className="text-blue-300 text-xs mt-2">Secure • Professional • Reliable • HIPAA Compliant</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
