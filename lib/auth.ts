"use client"

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendEmailVerification,
} from "firebase/auth"
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { auth, db, googleProvider } from "./firebase"

export interface UserProfile {
  uid: string
  email: string
  firstName: string
  lastName: string
  middleName?: string
  phone?: string
  age?: number
  emailVerified: boolean
  role: "user" | "admin" | "manager"
  createdAt: any
  updatedAt: any
}

// Check if email is admin
const isAdminEmail = (email: string): boolean => {
  const adminEmails = ["admin.control@google.com"]
  return adminEmails.includes(email.toLowerCase())
}

// Clean data before sending to Firestore
const cleanFirestoreData = (data: any) => {
  const cleaned: any = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value
    }
  }
  return cleaned
}

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone?: string,
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Send email verification
    await sendEmailVerification(user)

    // Determine role based on email
    const role = isAdminEmail(email) ? "admin" : "user"

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      firstName,
      lastName,
      emailVerified: false,
      role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Add optional fields only if they exist
    if (phone && phone.trim()) {
      userProfile.phone = phone.trim()
    }

    const cleanedProfile = cleanFirestoreData(userProfile)
    await setDoc(doc(db, "users", user.uid), cleanedProfile)

    return { user, profile: userProfile }
  } catch (error: any) {
    console.error("Sign up error:", error)
    throw new Error(getFirebaseErrorMessage(error))
  }
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Check if user profile exists and update role if needed
    const userDoc = await getDoc(doc(db, "users", user.uid))

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile
      // Update role if user is admin but profile doesn't reflect it
      if (isAdminEmail(email) && userData.role !== "admin") {
        const updateData = cleanFirestoreData({
          role: "admin",
          updatedAt: serverTimestamp(),
        })
        await setDoc(doc(db, "users", user.uid), updateData, { merge: true })
      }
    } else {
      // Create profile if it doesn't exist (for existing admin accounts)
      const role = isAdminEmail(email) ? "admin" : "user"
      const names = user.displayName?.split(" ") || ["Admin", "User"]

      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        firstName: names[0],
        lastName: names.slice(1).join(" ") || "User",
        emailVerified: user.emailVerified,
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const cleanedProfile = cleanFirestoreData(userProfile)
      await setDoc(doc(db, "users", user.uid), cleanedProfile)
    }

    return user
  } catch (error: any) {
    console.error("Sign in error:", error)
    throw new Error(getFirebaseErrorMessage(error))
  }
}

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    // Check if user profile exists
    const userDoc = await getDoc(doc(db, "users", user.uid))

    if (!userDoc.exists()) {
      // Create new user profile
      const names = user.displayName?.split(" ") || ["", ""]
      const role = isAdminEmail(user.email || "") ? "admin" : "user"

      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        firstName: names[0],
        lastName: names.slice(1).join(" ") || "",
        emailVerified: user.emailVerified,
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const cleanedProfile = cleanFirestoreData(userProfile)
      await setDoc(doc(db, "users", user.uid), cleanedProfile)
    } else {
      // Update role if needed for existing users
      const userData = userDoc.data() as UserProfile
      if (isAdminEmail(user.email || "") && userData.role !== "admin") {
        const updateData = cleanFirestoreData({
          role: "admin",
          updatedAt: serverTimestamp(),
        })
        await setDoc(doc(db, "users", user.uid), updateData, { merge: true })
      }
    }

    return user
  } catch (error: any) {
    console.error("Google sign in error:", error)
    throw new Error(getFirebaseErrorMessage(error))
  }
}

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
  } catch (error: any) {
    console.error("Sign out error:", error)
    throw new Error(getFirebaseErrorMessage(error))
  }
}

// Get user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid))
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile
    }
    return null
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

// Update user profile
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    const cleanedUpdates = cleanFirestoreData({
      ...updates,
      updatedAt: serverTimestamp(),
    })
    await setDoc(doc(db, "users", uid), cleanedUpdates, { merge: true })
  } catch (error: any) {
    console.error("Update profile error:", error)
    throw new Error(getFirebaseErrorMessage(error))
  }
}

// Firebase error message handler
const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error.code || error.message || ""

  switch (errorCode) {
    case "auth/user-not-found":
      return "No account found with this email address"
    case "auth/wrong-password":
      return "Incorrect password"
    case "auth/email-already-in-use":
      return "An account with this email already exists"
    case "auth/weak-password":
      return "Password should be at least 6 characters"
    case "auth/invalid-email":
      return "Invalid email address"
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later"
    case "auth/network-request-failed":
      return "Network error. Please check your connection"
    case "permission-denied":
      return "Access denied. Please check your permissions"
    case "unavailable":
      return "Service temporarily unavailable. Please try again"
    default:
      if (errorCode.includes("invalid data") || errorCode.includes("Unsupported field value")) {
        return "Invalid data provided. Please check your information"
      }
      return "An error occurred. Please try again"
  }
}
