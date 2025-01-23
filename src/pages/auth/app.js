// Import Firebase authentication and the modular firebase config
import { auth } from './firebaseConfig.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import $ from 'jquery';  // Ensure jQuery is loaded

// Get DOM elements
const form = $("#form-el")[0];
const swapSignInUpBtn = $("#swap-sign-in-up")[0];
const heading = $("#heading")[0];
const formSubmitBtn = $("#form-submit-btn")[0];
const switchNote = $("#switch-note")[0];
const formContainer = $('#form-container')[0];
const signOutBtn = $('#sign-out-btn')[0];
const errorModal = $('#error-modal');
const verifyEmailBtn = $('#email-verify-btn')[0];
const forgotPassBtn = $('#forgot-pass-btn')[0];
const googleAuthBtn = $('#google-auth')[0];

// Default state for submit action
let submitAction = "sign-up", forceToSignIn = false;

// Switch between sign-up and sign-in forms
const switchSignInSignUp = (swapTo) => {
    if (swapTo === "sign-in") {
        heading.innerText = "Sign In";
        formSubmitBtn.innerText = "Sign In";
        swapSignInUpBtn.innerText = "Sign Up";
        switchNote.innerText = "Don't have an account ?";
        submitAction = "sign-in";
        forgotPassBtn.classList.remove('d-none');
        form['passwordInput'].classList.remove('d-none');
        forceToSignIn = false;
    } else {
        heading.innerText = "Sign Up";
        formSubmitBtn.innerText = "Sign Up";
        swapSignInUpBtn.innerText = "Sign In";
        switchNote.innerText = "Already have an account ?";
        submitAction = "sign-up";
        forgotPassBtn.classList.add('d-none');
        form['passwordInput'].classList.remove('d-none');
        forceToSignIn = false;
    }
};

// Validate email and password
const validateForm = (email, pass = { length: 8 }) => {
    const pattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    return pattern.test(email) && pass.length >= 8;
};

// Update UI for reset password view
const updateUiForResetPass = () => {
    heading.innerText = "Reset Password";
    formSubmitBtn.innerText = "Reset";
    swapSignInUpBtn.innerText = "Sign In";
    switchNote.innerText = "Back to";
    submitAction = "reset-pass";
    forgotPassBtn.classList.add('d-none');
    form['passwordInput'].classList.add('d-none');
    forceToSignIn = true;
};

// Switch between sign-in and sign-up
swapSignInUpBtn.addEventListener("click", () => {
    let currentData = swapSignInUpBtn.attributes['aria-data'].value;
    currentData = switchSignInSignUp(forceToSignIn ? "sign-in" : currentData);
    swapSignInUpBtn.attributes['aria-data'].value = currentData;
});

// Prevent default form submission
form.addEventListener("submit", e => e.preventDefault());

// Handle form submission (sign-up, sign-in, reset password)
formSubmitBtn.addEventListener("click", (e) => {
    const email = form['emailInput'].value;
    const pass = form['passwordInput'].value;
    if (!validateForm(email, pass)) {
        return showError("Please enter a valid email and password (min. 8 characters).");
    }

    if (submitAction === "sign-up") {
        signUpUser(email, pass);
    } else if (submitAction === "sign-in") {
        signInUser(email, pass);
    } else if (submitAction === "reset-pass") {
        resetPassword(email);
    }
});

// Handle sign out
signOutBtn.addEventListener("click", () => {
    signOutUser();
});

// Handle email verification
verifyEmailBtn.addEventListener("click", () => {
    verifyEmail();
});

// Handle forgot password
forgotPassBtn.addEventListener("click", () => {
    updateUiForResetPass();
});

// Handle Google sign-in
googleAuthBtn.addEventListener("click", () => {
    signInUserWithGoogle();
});

// Firebase Authentication Functions

// Sign-up user
const signUpUser = (email, password) => {
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('Signed up:', user);
            window.location.href = 'userprofile.html';  // Redirect to user profile page
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log('Error signing up:', errorCode, errorMessage);
            showError(errorMessage);
        });
};

// Sign-in user
const signInUser = (email, password) => {
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('Signed in:', user);
            window.location.href = 'userprofile.html';  // Redirect to user profile page
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log('Error signing in:', errorCode, errorMessage);
            showError(errorMessage);
        });
};

// Reset password
const resetPassword = (email) => {
    sendPasswordResetEmail(auth, email)
        .then(() => {
            console.log('Password reset email sent');
            alert('Password reset email sent! Check your inbox.');
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log('Error resetting password:', errorCode, errorMessage);
            showError(errorMessage);
        });
};

// Sign out user
const signOutUser = () => {
    signOut(auth)
        .then(() => {
            console.log('Signed out successfully');
            window.location.href = '/pages/auth/login.html';  // Redirect to login page after sign-out
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
        .then((result) => {
            const user = result.user;
            console.log('Google Sign-In Success:', user);
            window.location.href = 'userprofile.html';  // Redirect to user profile page
        })
        .catch((error) => {
            console.log('Google Sign-In Error:', error.message);
            showError(error.message);
        });
};

// Show error message to the user
const showError = (message) => {
    errorModal.text(message).show();  // You might want to handle hiding as well, like:
    setTimeout(() => {
        errorModal.hide();
    }, 5000);
};

/* particlesJS.load(@dom-id, @path-json, @callback (optional)); */
particlesJS.load('particles-js', 'particles.json', function() {
    console.log('callback - particles.js config loaded');
  });
