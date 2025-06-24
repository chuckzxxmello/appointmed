import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyCZfi1aIc3zDdZD7NR7kN2Jm4hnCtPHWcQ",
  authDomain: "appointment-scheduling-s-57d01.firebaseapp.com",
  databaseURL: "https://appointment-scheduling-s-57d01-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "appointment-scheduling-s-57d01",
  storageBucket: "appointment-scheduling-s-57d01.firebasestorage.app",
  messagingSenderId: "1069885306589",
  appId: "1:1069885306589:web:b31768194add4087754d34",
  measurementId: "G-KQ4PQZZZBM",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: "select_account",
})

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null

export default app
