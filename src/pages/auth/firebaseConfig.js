// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCZfi1aIc3zDdZD7NR7kN2Jm4hnCtPHWcQ", // Replace with your actual API key
    authDomain: "appointment-scheduling-s-57d01.firebaseapp.com",
    databaseURL: "https://appointment-scheduling-s-57d01-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "appointment-scheduling-s-57d01",
    storageBucket: "appointment-scheduling-s-57d01.firebasestorage.app",
    messagingSenderId: "1069885306589",
    appId: "1:1069885306589:web:b31768194add4087754d34",
    measurementId: "G-KQ4PQZZZBM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };