"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth"
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle, Shield, Eye, EyeOff } from "lucide-react"
import Image from "next/image"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }

    if (!acceptTerms) {
      setError("Please accept the terms and conditions")
      return false
    }

    return true
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      await signUpWithEmail(formData.email, formData.password, formData.firstName, formData.lastName, formData.phone)

      setSuccess("Account created successfully! Please check your email for verification.")
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account before signing in.",
      })

      // Redirect to sign in page after 3 seconds
      setTimeout(() => {
        router.push("/auth/signin")
      }, 3000)
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      await signInWithGoogle()
      toast({
        title: "Welcome to AppointMED!",
        description: "Your account has been created successfully.",
      })
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Google sign-up failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="flex justify-center mb-4">
            <Image
              src="/apple-touch-icon.png"
              alt="AppointMED Logo"
              width={64}
              height={64}
              className="rounded-xl shadow-lg hover-glow transition-all duration-300"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join AppointMED</h1>
          <p className="text-gray-600">Create your account for professional healthcare management</p>
        </div>

        <Card className="border-2 border-gray-100 shadow-2xl hover-lift animate-scale-in">
          <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
            <CardTitle className="text-3xl font-bold text-gray-900">Create Account</CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Join AppointMED for secure appointment management
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50 animate-bounce-in">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 animate-bounce-in">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleEmailSignUp} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="pl-10 h-12 border-gray-300 focus:border-blue-900 focus:ring-blue-900 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="pl-10 h-12 border-gray-300 focus:border-blue-900 focus:ring-blue-900 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.3s" }}>
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-900 focus:ring-blue-900 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.4s" }}>
                <Label htmlFor="phone" className="text-gray-700 font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-900 focus:ring-blue-900 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.5s" }}>
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-900 focus:ring-blue-900 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.6s" }}>
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-900 focus:ring-blue-900 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3 animate-slide-up" style={{ animationDelay: "0.7s" }}>
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={setAcceptTerms}
                  className="border-gray-300"
                />
                <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-900 hover:underline font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-900 hover:underline font-medium">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white h-12 text-base font-medium shadow-lg hover-lift transition-all duration-300 animate-slide-up"
                style={{ animationDelay: "0.8s" }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Secure Account"
                )}
              </Button>
            </form>

            <Separator className="my-6" />

            <Button
              onClick={handleGoogleSignUp}
              variant="outline"
              className="w-full bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 h-12 text-base font-medium hover-lift transition-all duration-300 animate-slide-up"
              style={{ animationDelay: "0.9s" }}
              disabled={isLoading}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="text-center text-base text-gray-600 animate-fade-in">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="text-blue-900 hover:underline font-semibold transition-colors duration-300"
              >
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-500 animate-fade-in">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="h-4 w-4" />
            <p>Secure registration powered by Firebase</p>
          </div>
          <Link href="/" className="hover:text-gray-700 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
