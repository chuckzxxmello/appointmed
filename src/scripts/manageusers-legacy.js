// Legacy user management Firestore helpers
import { getFirestore, collection, addDoc, deleteDoc, getDocs, onSnapshot, doc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

export function listenLegacyUsers(db, callback) {
  const colRef = collection(db, 'users');
  return onSnapshot(colRef, (snapshot) => {
    let users = [];
    snapshot.docs.forEach((doc) => {
      users.push({ ...doc.data(), id: doc.id });
    });
    if (callback) callback(users);
  });
}

export async function addLegacyUser(db, userData) {
  const colRef = collection(db, 'users');
  return await addDoc(colRef, userData);
}

export async function deleteLegacyUser(db, userId) {
  const docRef = doc(db, 'users', userId);
  return await deleteDoc(docRef);
}

export async function getUsersFromFirestore(db) {
  const usersCollection = collection(db, 'users');
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
