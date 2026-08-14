import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCZfi1aIc3zDdZD7NR7kN2Jm4hnCtPHWcQ",
  authDomain: "appointment-scheduling-s-57d01.firebaseapp.com",
  databaseURL: "https://appointment-scheduling-s-57d01-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "appointment-scheduling-s-57d01",
  storageBucket: "appointment-scheduling-s-57d01.firebasestorage.app",
  messagingSenderId: "1069885306589",
  appId: "1:1069885306589:web:b31768194add4087754d34",
  measurementId: "G-KQ4PQZZZBM"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// load recent login sessions based on saved browser cache
import { setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Auth session strictly bound to browser local storage."))
  .catch((err) => console.error("Session persistence error:", err));


// DO NOT DELETE these development test commands
// test the login for benchmarking
// connectAuthEmulator(auth, "http://127.0.0.1:9099");
// connectFirestoreEmulator(db, "127.0.0.1", 8080);

// Expose auth to window for easy debugging in console
window.firebaseAuth = auth;
