import { initializeApp} from 'firebase/app'
import {
    collection,
    snapshot,
    doc,
    getDocs,
    getFirestore,
    addDoc, deleteDoc, onSnapshot,querySnapshot

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

db.collection("users")
.get()
.then(querySnapshot=>{
        querySnapshot.forEach(doc=>{
            let data = doc.data();
            let row  = `<tr>
                            <td>${data.firstName}</td>
                            <td>${data.middleName}</td>
                            <td>${data.surname}</td>
                      </tr>`;
            let table = document.getElementById('myTable')
            table.innerHTML += row
        })
    })
    .catch(err=>{
        console.log(`Error: ${err}`)
    });