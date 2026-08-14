// Import Firebase authentication and modular firebase config
import { auth, db } from './firebaseConfig.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Get DOM elements safely
const form = document.getElementById("form-el");
const swapSignInUpBtn = document.getElementById("swap-sign-in-up");
const heading = document.getElementById("heading");
const formSubmitBtn = document.getElementById("form-submit-btn");
const switchNote = document.getElementById("switch-note");
const signOutBtn = document.getElementById('sign-out-btn');
const errorModal = document.getElementById('error-modal');
const verifyEmailBtn = document.getElementById('email-verify-btn');
const forgotPassBtn = document.getElementById('forgot-pass-btn');
const googleAuthBtn = document.getElementById('google-auth');

// Default state for submit action
let submitAction = "sign-in", forceToSignIn = true;

// Switch between sign-up and sign-in forms
const switchSignInSignUp = (swapTo) => {
    if (swapTo === "sign-in") {
        if (heading) heading.innerText = "Sign In";
        if (formSubmitBtn) formSubmitBtn.innerText = "Sign In";
        if (swapSignInUpBtn) swapSignInUpBtn.innerText = "Sign Up";
        if (switchNote) switchNote.innerText = "Don't have an account?";
        submitAction = "sign-in";
        if (forgotPassBtn) forgotPassBtn.classList.remove('d-none');
        if (form && form['passwordInput']) form['passwordInput'].classList.remove('d-none');
        forceToSignIn = false;
        return "sign-up";
    } else {
        if (heading) heading.innerText = "Sign Up";
        if (formSubmitBtn) formSubmitBtn.innerText = "Sign Up";
        if (swapSignInUpBtn) swapSignInUpBtn.innerText = "Sign In";
        if (switchNote) switchNote.innerText = "Already have an account?";
        submitAction = "sign-up";
        if (forgotPassBtn) forgotPassBtn.classList.add('d-none');
        if (form && form['passwordInput']) form['passwordInput'].classList.remove('d-none');
        forceToSignIn = false;
        return "sign-in";
    }
};

// Validate email and password
const validateForm = (email, pass = "") => {
    const pattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    return pattern.test(email) && pass.length >= 6;
};

// Update UI for reset password view
const updateUiForResetPass = () => {
    if (heading) heading.innerText = "Reset Password";
    if (formSubmitBtn) formSubmitBtn.innerText = "Reset";
    if (swapSignInUpBtn) swapSignInUpBtn.innerText = "Sign In";
    if (switchNote) switchNote.innerText = "Back to";
    submitAction = "reset-pass";
    if (forgotPassBtn) forgotPassBtn.classList.add('d-none');
    if (form && form['passwordInput']) form['passwordInput'].classList.add('d-none');
    forceToSignIn = true;
};

// Switch between sign-in and sign-up
if (swapSignInUpBtn) {
    swapSignInUpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const currentData = swapSignInUpBtn.getAttribute('aria-data') || 'sign-up';
        const nextData = switchSignInSignUp(forceToSignIn ? "sign-in" : currentData);
        swapSignInUpBtn.setAttribute('aria-data', nextData);
    });
}

// Handle form submit button
if (formSubmitBtn) {
    formSubmitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('emailInput') || (form ? form['emailInput'] : null);
        const passInput = document.getElementById('passwordInput') || (form ? form['passwordInput'] : null);

        const email = emailInput ? emailInput.value.trim() : '';
        const pass = passInput ? passInput.value.trim() : '';

        if (submitAction !== "reset-pass" && !validateForm(email, pass)) {
            showError("Please enter a valid email address and password (min. 6 characters).");
            return;
        }

        if (submitAction === "sign-up") {
            signUpUser(email, pass);
        } else if (submitAction === "sign-in") {
            signInUser(email, pass);
        } else if (submitAction === "reset-pass") {
            resetPassword(email);
        }
    });
}

if (form) {
    form.addEventListener("submit", (e) => e.preventDefault());
}

if (signOutBtn) signOutBtn.addEventListener("click", () => signOutUser());
if (verifyEmailBtn) verifyEmailBtn.addEventListener("click", () => verifyEmail());
if (forgotPassBtn) forgotPassBtn.addEventListener("click", (e) => { e.preventDefault(); updateUiForResetPass(); });
if (googleAuthBtn) googleAuthBtn.addEventListener("click", (e) => { e.preventDefault(); signInUserWithGoogle(); });

// Firebase Authentication Functions

// Sign-up user
const signUpUser = (email, password) => {
    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            console.log('Signed up:', user);

            try {
              const userDocRef = doc(db, 'users', user.uid);
              const isAdmin = email.toLowerCase().includes('admin');
              await setDoc(userDocRef, {
                email: email,
                role: isAdmin ? 'admin' : 'patient',
                createdAt: new Date().toISOString()
              }, { merge: true });

              if (isAdmin) {
                window.location.href = '../manageuser/adminhome.html';
                return;
              }
            } catch (err) {
              console.log("Firestore profile creation notice:", err);
            }

            window.location.href = 'userprofile.html';
        })
        .catch((error) => {
            console.log('Error signing up:', error.code, error.message);
            showError(error.message);
        });
};

// Sign-in user (Smart role check -> Admin vs Patient redirection)
const signInUser = (email, password) => {
    signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            const user = userCredential.user;
            console.log('Signed in:', user);

            try {
              const userDocRef = doc(db, 'users', user.uid);
              const userSnap = await getDoc(userDocRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.role === 'admin' || (user.email && user.email.toLowerCase().includes('admin'))) {
                  window.location.href = '../manageuser/adminhome.html';
                  return;
                }
              } else if (user.email && user.email.toLowerCase().includes('admin')) {
                window.location.href = '../manageuser/adminhome.html';
                return;
              }
            } catch (err) {
              console.log("Role check fallback:", err);
              if (user.email && user.email.toLowerCase().includes('admin')) {
                window.location.href = '../manageuser/adminhome.html';
                return;
              }
            }

            window.location.href = 'userprofile.html';
        })
        .catch((error) => {
            console.log('Error signing in:', error.code, error.message);
            showError(error.message);
        });
};

// Reset password
const resetPassword = (email) => {
    if (!email) {
        showError("Please enter your email address.");
        return;
    }
    sendPasswordResetEmail(auth, email)
        .then(() => {
            alert('Password reset email sent! Please check your inbox.');
        })
        .catch((error) => {
            console.log('Error resetting password:', error.code, error.message);
            showError(error.message);
        });
};

// Sign out user
const signOutUser = () => {
    signOut(auth)
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.log('Error signing out:', error);
            showError(error.message);
        });
};

// Verify email
const verifyEmail = () => {
    const user = auth.currentUser;
    if (user) {
        sendEmailVerification(user)
            .then(() => {
                alert('Verification email sent!');
            })
            .catch((error) => {
                console.log('Error sending verification email:', error);
                showError(error.message);
            });
    }
};

// Google Sign-In
const signInUserWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then(async (result) => {
            const user = result.user;
            console.log('Google Sign-In Success:', user);

            try {
              const userDocRef = doc(db, 'users', user.uid);
              const userSnap = await getDoc(userDocRef);
              if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.role === 'admin' || (user.email && user.email.toLowerCase().includes('admin'))) {
                  window.location.href = '../manageuser/manageusers.html';
                  return;
                }
              }
            } catch (err) {
              console.log("Google sign-in role check notice:", err);
            }

            window.location.href = 'userprofile.html';
        })
        .catch((error) => {
            console.log('Google Sign-In Error:', error.message);
            showError(error.message);
        });
};

// Show error message to the user
const showError = (message) => {
    if (!errorModal) {
      alert(message);
      return;
    }
    errorModal.textContent = message;
    errorModal.style.display = 'block';
    setTimeout(() => {
        errorModal.style.display = 'none';
    }, 5000);
};

// Safe Particles.js initializer
if (typeof particlesJS !== 'undefined') {
    try {
        particlesJS.load('particles-js', 'particles.json', function() {
            console.log('particles.js config loaded');
        });
    } catch (e) {
        console.log('Particles config skip notice');
    }
}
