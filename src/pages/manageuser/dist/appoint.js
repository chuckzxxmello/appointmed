// appoint.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import {
    collection,
    doc,
    getDocs,
    getFirestore,
    addDoc,
    deleteDoc,
    onSnapshot,
    updateDoc

} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js'

const firebaseConfig = {
    apiKey: "AIzaSyCZfi1aIc3zDdZD7NR7kN2Jm4hnCtPHWcQ",
    authDomain: "appointment-scheduling-s-57d01.firebaseapp.com",
    databaseURL: "https://appointment-scheduling-s-57d01-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "appointment-scheduling-s-57d01",
    storageBucket: "appointment-scheduling-s-57d01.firebasestorage.app",
    messagingSenderId: "1069885306589",
    appId: "1:1069885306589:web:b31768194add4087754d34",
    measurementId: "G-KQ4PQZZZBM"
};

initializeApp(firebaseConfig)

const db = getFirestore()

const colRef = collection(db, 'appointments')


onSnapshot(colRef, (snapshot) => {
    let users = []
    snapshot.docs.forEach((doc) => {
        users.push({ ...doc.data(), id: doc.id })

    })
    console.log(users)
})


//adding documents

const addappointForm = document.querySelector('.set')
addappointForm.addEventListener('submit', (e) => {
    e.preventDefault()
    addDoc(colRef, {
        email: addappointForm.email.value,
        firstName: addappointForm.firstName.value,
        middleName: addappointForm.middleName.value,
        surname: addappointForm.surname.value,
        contact: addappointForm.contact.value,
        appointmentDate: addappointForm.appointmentDate.value,
        appointmentTimeStart: addappointForm.appointmentTimeStart.value,
        appointmentTimeEnd: addappointForm.appointmentTimeEnd.value,
        appointmentType: addappointForm.appointmentType.value,
        appointmentStatus: addappointForm.appointmentStatus.value,
        paymentStatus: addappointForm.paymentStatus.value,
        paymentType: addappointForm.paymentType.value,
        payment: addappointForm.payment.value,
        doctor: addappointForm.doctor.value,

    })
        .then(() => {
            addappointForm.reset()
        })
})

//delete documents



const deleteappointForm = document.querySelector('.deleteappoint')

deleteappointForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const docRef = doc(db, 'appointments',
        deleteappointForm.id.value,
    )
    deleteDoc(docRef)
        .then(() => {
            deleteappointForm.reset()
        })

})


const updateForm = document.querySelector('.update-form');

updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get values from the form
    const id = updateForm.id.value; // User ID (Document ID)
    const name = updateForm.name.value;
    const email = updateForm.email.value;
    const appointmentDate = updateForm.appointmentDate.value;
    const appointmentTimeStart = updateForm.appointmentTimeStart.value;
    const appointmentTimeEnd = updateForm.appointmentTimeEnd.value;
    const doctor = updateForm.doctor.value; // Make sure this matches your form field name
    const paymentType = updateForm.paymentType.value;
    const appointmentStatus = updateForm.appointmentStatus.value;
    const paymentStatus = updateForm.paymentStatus.value;
    const payment = updateForm.payment.value;

    // Check if user ID is present
    if (!id) {
        alert('User ID is required to update the document.');
        return;
    }

    // Create an object with only the fields that have values
    const updatedData = {};
    if (name) updatedData.name = name;
    if (appointmentDate) updatedData.appointmentDate = appointmentDate;
    if (email) updatedData.email = email;
    if (appointmentTimeStart) updatedData.appointmentTimeStart = appointmentTimeStart;
    if (appointmentTimeEnd) updatedData.appointmentTimeEnd = appointmentTimeEnd;
    if (doctor) updatedData.doctor = doctor;
    if (paymentType) updatedData.paymentType = paymentType;
    if (appointmentStatus) updatedData.appointmentStatus = appointmentStatus;
    if (paymentStatus) updatedData.paymentStatus = paymentStatus;
    if (payment) updatedData.payment = payment;

    try {
        // Reference the Firestore document
        const docRef = doc(db, 'appointments', id);

        // Update only the fields that have new values
        await updateDoc(docRef, updatedData);

        alert('User updated successfully!');

        // Clear the form after update
        updateForm.reset();
    } catch (error) {
        console.error('Error updating document: ', error);
        alert('Failed to update user. Please check the console for more details.');
    }
});



// Function to fetch appointments from Firestore (this may be useful if you want an initial load)
async function getUsersFromFirestore() {
    const usersCollection = collection(db, 'appointments');
    const snapshot = await getDocs(usersCollection);
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return appointments;
}

// Function to print the appointments into the table
function printTable(appointments) {
    const table = document.getElementById('appointmentTable');

    // Ensure the table has a <thead> and <tbody> structure
    let thead = table.querySelector('thead');
    let tbody = table.querySelector('tbody');

    // If <thead> doesn't exist, create it and append it to the table
    if (!thead) {
        thead = document.createElement('thead');
        table.appendChild(thead);
        const headerRow = `
            <tr>

                <th>ID</th>
                <th>Email</th>
                <th>Full Name</th>
                <th>Phone Number</th>
                <th>Type</th>
                <th>Date</th>
                <th>TimeStart</th>
                <th>TimeEnd</th>
                <th>Type of Payment</th>
                <th>AppointStatus</th>
                <th>PaymentStatus</th>
                <th>Cost</th>
                <th>Doctor</th>
            </tr>`;
        thead.innerHTML = headerRow;
    }

    // Clear existing rows in the <tbody> if it exists, otherwise create it
    if (!tbody) {
        tbody = document.createElement('tbody');
        table.appendChild(tbody);
    } else {
        tbody.innerHTML = ''; // Clear the previous rows
    }

    // Sort appointments by date and time
    appointments.sort((a, b) => {
        const dateTimeA = new Date(`${a.appointmentDate}T${a.appointmentTimeStart}`);
        const dateTimeB = new Date(`${b.appointmentDate}T${b.appointmentTimeStart}`);
        return dateTimeA - dateTimeB;
    });

    // Loop through each appointment and add a row to the table
    appointments.forEach((data) => {
        const row = `
            <tr>
                <td>${data.id}</td>
                <td>${data.email}</td>
                <td>${data.firstName} ${data.middleName} ${data.surname}</td>
                <td>${data.contact}</td>
                <td>${data.appointmentType}</td>
                <td>${data.appointmentDate}</td>
                <td>${data.appointmentTimeStart}</td>
                <td>${data.appointmentTimeEnd}</td>
                <td>${data.paymentType}</td>
                <td>${data.appointmentStatus}</td>
                <td>${data.paymentStatus}</td>
                <td>${data.payment}</td>
                <td>${data.doctor}</td>
            </tr>`;
        tbody.innerHTML += row; // Append each new row inside <tbody>
    });
}

// Function to listen for real-time Firestore changes and update the table accordingly
function listenToFirestoreChanges() {
    const usersCollection = collection(db, 'appointments');

    // Set up a real-time listener to Firestore collection
    onSnapshot(usersCollection, (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Call the function to print the table with the updated appointments
        printTable(appointments);
    });
}

// Call the function to start listening for Firestore changes
listenToFirestoreChanges();