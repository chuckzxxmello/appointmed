import { initializeApp} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import {
    collection,
    doc,
    getDocs,
    getFirestore,
    addDoc, deleteDoc, onSnapshot,updateDoc

}from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js'


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

  const colRef = collection(db, 'users')


  onSnapshot(colRef, (snapshot) => {
    let users = []
    snapshot.docs.forEach((doc) =>{
        users.push({...doc.data(), id: doc.id})

    })
    console.log(users)
})


//adding documents

const addbookForm = document.querySelector('.add')
addbookForm.addEventListener('submit', (e) => {
        e.preventDefault()
        addDoc(colRef, {
            firstName: addbookForm.firstName.value,
            middleName: addbookForm.middleName.value,
            surname: addbookForm.surname.value,

            email: addbookForm.email.value,
            professional: addbookForm.professional.value,
            phoneNumber: addbookForm.phoneNumber.value
        })
        .then(() => {
            addbookForm.reset()
        })
    })

    //delete documents

    

    const deletebookForm = document.querySelector('.delete')

    deletebookForm.addEventListener('submit', (e) => {
        e.preventDefault()

        const docRef = doc(db, 'users', 
            deletebookForm.id.value,
        )
        deleteDoc(docRef)
        .then(() => {
            deletebookForm.reset()
        })

    })

    const updateForm = document.querySelector('.update-form');

updateForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    // Get values from the form
    const id = updateForm.id.value; // User ID (Document ID)
    const firstName = updateForm.firstName.value;
    const middleName = updateForm.middleName.value;
    const surname = updateForm.surname.value;
    const email = updateForm.email.value;
    const professional = updateForm.professional.value;
    const phoneNumber = updateForm.phoneNumber.value;

    // Check if user ID is present
    if (!id) { 
        alert('User ID is required to update the document.');
        return;
    }

    // Create an object with only the fields that have values
    const updatedData = {};
    if (firstName) updatedData.firstName = firstName;
    if (middleName) updatedData.middleName = middleName;
    if (surname) updatedData.surname = surname;
    if (email) updatedData.email = email;
    if (professional) updatedData.professional = professional;
    if (phoneNumber) updatedData.phoneNumber = phoneNumber;

    try {
        // Reference the Firestore document
        const docRef = doc(db, 'users', id);

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


    async function getUsersFromFirestore() {
        const usersCollection = collection(db, 'users');
        const snapshot = await getDocs(usersCollection);
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return users;
    }
  
    function printTable(users) {
        const table = document.getElementById('myTable');
        
        // Clear the table only for the rows, but not the header
        table.innerHTML = ''; 
        
        // Create the header row (only once)
        const headerRow = `
            <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Middle Name</th>
                <th>Surname</th>
                <th>Email</th>
                <th>Professional</th>
                <th>Phone Number</th>
            </tr>`;
        
        // Add the header row to the table (only once)
        table.innerHTML = headerRow; // Set it initially
    
        // Loop through each user and add a row to the table
        users.forEach((data) => {
            const row = `
                <tr>
                    <td>${data.id}</td>
                    <td>${data.firstName}</td>
                    <td>${data.middleName}</td>
                    <td>${data.surname}</td>
                    <td>${data.email}</td>
                    <td>${data.professional}</td>
                    <td>${data.phoneNumber}</td>
                </tr>`;
            
            // Append the new row after the header
            table.innerHTML += row;
        });
    }
    
    function listenToFirestoreChanges() {
        const db = getFirestore();  // Assuming 'db' is your Firestore instance
        const usersCollection = collection(db, 'users');
    
        // Set up a real-time listener
        onSnapshot(usersCollection, (snapshot) => {
            const users = snapshot.docs.map(doc => ({
                id: doc.id, 
                ...doc.data()
            }));
            
            // Call the function to print the table with updated users
            printTable(users);
        });
    }
    
    // Call the function to start listening to Firestore changes
    listenToFirestoreChanges();