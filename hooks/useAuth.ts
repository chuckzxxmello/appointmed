"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getUserProfile, type UserProfile, signOut } from "@/lib/auth" // 1. Import signOut here

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        try {
          const userProfile = await getUserProfile(user.uid)
          setProfile(userProfile)
          console.log("User profile loaded:", userProfile)
        } catch (error) {
          console.error("Error loading user profile:", error)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const isAdmin = profile?.role === "admin" || user?.email === "admin.control@google.com"

  return {
    user,
    profile,
    loading,
    isAdmin,
    signOut,
  }
}