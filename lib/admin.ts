import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore"
import { db } from "./firebase"

// Get all users with proper error handling
export const getAllUsers = async () => {
  try {
    const usersCollection = collection(db, "users")
    const usersSnapshot = await getDocs(usersCollection)
    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Ensure role defaults to 'user' if not set
      role: doc.data().role || "user",
      // Handle createdAt properly
      createdAt: doc.data().createdAt || new Date(),
    }))
    console.log("Fetched users:", users)
    return users
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}

// Get all appointments with proper data handling
export const getAllAppointments = async () => {
  try {
    const appointmentsCollection = collection(db, "appointments")
    const appointmentsSnapshot = await getDocs(appointmentsCollection)
    const appointments = appointmentsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Ensure all required fields exist
        appointmentDate: data.appointmentDate || "",
        appointmentTimeStart: data.appointmentTimeStart || "",
        appointmentTimeEnd: data.appointmentTimeEnd || "",
        appointmentType: data.appointmentType || "",
        appointmentStatus: data.appointmentStatus || "PENDING",
        doctor: data.doctor || "",
        contact: data.contact || "",
        email: data.email || "",
        firstName: data.firstName || "",
        surname: data.surname || "",
        payment: data.payment || "0",
        paymentStatus: data.paymentStatus || "NOT_PAID",
        paymentType: data.paymentType || "CASH",
        createdAt: data.createdAt || new Date(),
      }
    })
    console.log("Fetched appointments:", appointments)
    return appointments
  } catch (error) {
    console.error("Error fetching appointments:", error)
    throw error
  }
}

// Get appointments for specific user
export const getUserAppointments = async (userEmail: string) => {
  try {
    const appointmentsCollection = collection(db, "appointments")
    const appointmentsQuery = query(
      appointmentsCollection,
      where("email", "==", userEmail),
      orderBy("appointmentDate", "asc"),
    )
    const appointmentsSnapshot = await getDocs(appointmentsQuery)
    const appointments = appointmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    console.log(`Fetched appointments for ${userEmail}:`, appointments)
    return appointments
  } catch (error) {
    console.error("Error fetching user appointments:", error)
    // If orderBy fails, try without it
    try {
      const appointmentsCollection = collection(db, "appointments")
      const simpleQuery = query(appointmentsCollection, where("email", "==", userEmail))
      const snapshot = await getDocs(simpleQuery)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (fallbackError) {
      console.error("Fallback query also failed:", fallbackError)
      return []
    }
  }
}

// Get all announcements
export const getAllAnnouncements = async () => {
  try {
    const announcementsCollection = collection(db, "announcements")
    const announcementsSnapshot = await getDocs(announcementsCollection)
    const announcements = announcementsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt || new Date(),
    }))
    console.log("Fetched announcements:", announcements)
    return announcements
  } catch (error) {
    console.error("Error fetching announcements:", error)
    throw error
  }
}

// Create appointment
export const createAppointment = async (appointmentData: any) => {
  try {
    const appointmentsCollection = collection(db, "appointments")
    const docRef = await addDoc(appointmentsCollection, {
      ...appointmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    console.log("Created appointment:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error creating appointment:", error)
    throw error
  }
}

// Update appointment
export const updateAppointment = async (appointmentId: string, appointmentData: any) => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId)
    await updateDoc(appointmentRef, {
      ...appointmentData,
      updatedAt: serverTimestamp(),
    })
    console.log("Updated appointment:", appointmentId)
  } catch (error) {
    console.error("Error updating appointment:", error)
    throw error
  }
}

// Delete appointment
export const deleteAppointment = async (appointmentId: string) => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId)
    await deleteDoc(appointmentRef)
    console.log("Deleted appointment:", appointmentId)
  } catch (error) {
    console.error("Error deleting appointment:", error)
    throw error
  }
}

// Create announcement
export const createAnnouncement = async (title: string, content: string, type: string, createdBy: string) => {
  try {
    const announcementsCollection = collection(db, "announcements")
    const docRef = await addDoc(announcementsCollection, {
      title,
      content,
      type,
      createdBy,
      createdAt: serverTimestamp(),
    })
    console.log("Created announcement:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error creating announcement:", error)
    throw error
  }
}

// Real-time listeners
export const subscribeToAppointments = (callback: (appointments: any[]) => void) => {
  const appointmentsCollection = collection(db, "appointments")
  return onSnapshot(appointmentsCollection, (snapshot) => {
    const appointments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    callback(appointments)
  })
}

export const subscribeToAnnouncements = (callback: (announcements: any[]) => void) => {
  const announcementsCollection = collection(db, "announcements")
  return onSnapshot(announcementsCollection, (snapshot) => {
    const announcements = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    callback(announcements)
  })
}

// Check if user is admin
export const isUserAdmin = async (email: string): Promise<boolean> => {
  return email === "admin.control@google.com"
}

// Update user profile and cascade changes to appointments
export const updateUserProfile = async (userId: string, userData: any) => {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    })

    // If email changed, update all associated appointments
    if (userData.email) {
      const appointmentsQuery = query(collection(db, "appointments"), where("email", "==", userData.email))
      const appointmentsSnapshot = await getDocs(appointmentsQuery)

      const updatePromises = appointmentsSnapshot.docs.map((appointmentDoc) => {
        const appointmentRef = doc(db, "appointments", appointmentDoc.id)
        return updateDoc(appointmentRef, {
          firstName: userData.firstName || appointmentDoc.data().firstName,
          surname: userData.lastName || appointmentDoc.data().surname,
          updatedAt: serverTimestamp(),
        })
      })

      await Promise.all(updatePromises)
    }

    console.log("Updated user profile and cascaded changes:", userId)
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

// Get appointments with better error handling and sorting
export const getAppointmentsWithDetails = async () => {
  try {
    const appointmentsCollection = collection(db, "appointments")
    const appointmentsQuery = query(appointmentsCollection, orderBy("appointmentDate", "desc"))
    const appointmentsSnapshot = await getDocs(appointmentsQuery)

    const appointments = appointmentsSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        appointmentDate: data.appointmentDate || "",
        appointmentTimeStart: data.appointmentTimeStart || "",
        appointmentTimeEnd: data.appointmentTimeEnd || "",
        appointmentType: data.appointmentType || "CONSULTATION",
        appointmentStatus: data.appointmentStatus || "PENDING",
        doctor: data.doctor || "",
        contact: data.contact || "",
        email: data.email || "",
        firstName: data.firstName || "",
        surname: data.surname || "",
        middleName: data.middleName || "",
        payment: data.payment || "0",
        paymentStatus: data.paymentStatus || "NOT_PAID",
        paymentType: data.paymentType || "CASH",
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt || new Date(),
      }
    })

    console.log("Fetched appointments with details:", appointments.length)
    return appointments
  } catch (error) {
    console.error("Error fetching appointments with details:", error)
    // Fallback without orderBy if index doesn't exist
    try {
      const appointmentsCollection = collection(db, "appointments")
      const appointmentsSnapshot = await getDocs(appointmentsCollection)
      return appointmentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (fallbackError) {
      console.error("Fallback query also failed:", fallbackError)
      return []
    }
  }
}

// Get announcements with better sorting
export const getAnnouncementsWithDetails = async () => {
  try {
    const announcementsCollection = collection(db, "announcements")
    const announcementsQuery = query(announcementsCollection, orderBy("createdAt", "desc"))
    const announcementsSnapshot = await getDocs(announcementsQuery)

    const announcements = announcementsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt || new Date(),
    }))

    console.log("Fetched announcements with details:", announcements.length)
    return announcements
  } catch (error) {
    console.error("Error fetching announcements with details:", error)
    // Fallback without orderBy
    try {
      const announcementsCollection = collection(db, "announcements")
      const announcementsSnapshot = await getDocs(announcementsCollection)
      return announcementsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (fallbackError) {
      console.error("Fallback announcements query failed:", fallbackError)
      return []
    }
  }
}

// Delete announcement with proper error handling
export const deleteAnnouncement = async (announcementId: string) => {
  try {
    const announcementRef = doc(db, "announcements", announcementId)
    await deleteDoc(announcementRef)
    console.log("Deleted announcement:", announcementId)
  } catch (error) {
    console.error("Error deleting announcement:", error)
    throw error
  }
}

// Update user role
export const updateUserRole = async (userId: string, role: string) => {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp(),
    })
    console.log("Updated user role:", userId, role)
  } catch (error) {
    console.error("Error updating user role:", error)
    throw error
  }
}
