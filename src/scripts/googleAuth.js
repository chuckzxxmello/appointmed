import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const auth = getAuth();

// Sign-in with Google using the popup flow
const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            // The result contains the signed-in user's information
            const user = result.user;
            console.log("User signed in: ", user);

            // Redirect to userprofile.html after successful login
            window.location.href = '/pages/auth/userprofile.html'; 
        })
        .catch((error) => {
            console.error("Error signing in with Google: ", error);
        });
};