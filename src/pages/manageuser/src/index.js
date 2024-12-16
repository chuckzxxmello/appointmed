import { initializeApp} from 'firebase/app'
import {
    collection,
    snapshot,
    doc,
    getDocs,
    getFirestore,
    addDoc, deleteDoc, onSnapshot

}from 'firebase/firestore'

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