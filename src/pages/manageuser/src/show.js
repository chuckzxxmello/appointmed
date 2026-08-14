import {
    collection,
    snapshot,
    doc,
    getDocs,
    addDoc, deleteDoc, onSnapshot,querySnapshot
}from 'firebase/firestore';
import { app, db } from '../../../scripts/firebase-config.js';

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