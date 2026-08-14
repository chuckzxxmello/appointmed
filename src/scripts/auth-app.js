// Import Firebase authentication and modular config
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { showToast } from "./ui-utils.js";

// Default state for auth form submit action
let submitAction = "sign-up", forceToSignIn = false;

export function initAuthForm(auth) {
  const form = document.getElementById("form-el");
  const swapSignInUpBtn = document.getElementById("swap-sign-in-up");
  const heading = document.getElementById("heading");
  const formSubmitBtn = document.getElementById("form-submit-btn");
  const switchNote = document.getElementById("switch-note");
  const forgotPassBtn = document.getElementById("forgot-pass-btn");

  if (!form || !formSubmitBtn) return;

  const switchSignInSignUp = (swapTo) => {
    if (swapTo === "sign-in") {
      if (heading) heading.innerText = "Sign In";
      if (formSubmitBtn) formSubmitBtn.innerText = "Sign In";
      if (swapSignInUpBtn) swapSignInUpBtn.innerText = "Sign Up";
      if (switchNote) switchNote.innerText = "Don't have an account ?";
      submitAction = "sign-in";
      if (forgotPassBtn) forgotPassBtn.classList.remove('d-none');
      forceToSignIn = false;
    } else {
      if (heading) heading.innerText = "Sign Up";
      if (formSubmitBtn) formSubmitBtn.innerText = "Sign Up";
      if (swapSignInUpBtn) swapSignInUpBtn.innerText = "Sign In";
      if (switchNote) switchNote.innerText = "Already have an account ?";
      submitAction = "sign-up";
      if (forgotPassBtn) forgotPassBtn.classList.add('d-none');
      forceToSignIn = false;
    }
  };

  const validateForm = (email, pass = { length: 8 }) => {
    const pattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
    return pattern.test(email) && pass.length >= 8;
  };

  if (swapSignInUpBtn) {
    swapSignInUpBtn.addEventListener("click", () => {
      let currentData = swapSignInUpBtn.getAttribute('aria-data') || 'sign-up';
      switchSignInSignUp(forceToSignIn ? "sign-in" : (currentData === 'sign-up' ? 'sign-in' : 'sign-up'));
    });
  }

  form.addEventListener("submit", e => e.preventDefault());

  formSubmitBtn.addEventListener("click", async () => {
    const emailInput = document.getElementById('emailInput');
    const passInput = document.getElementById('passwordInput');
    const email = emailInput ? emailInput.value : '';
    const password = passInput ? passInput.value : '';

    if (!email || !password || password.length < 8) {
      showToast("Please enter a valid email and password (min. 8 characters).", 'warning');
      return;
    }

    try {
      if (submitAction === "sign-up") {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast("Account successfully created!");
        window.location.href = "../manageuser/adminhome.html";
      } else if (submitAction === "sign-in") {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "../manageuser/adminhome.html";
      } else if (submitAction === "reset-pass") {
        await sendPasswordResetEmail(auth, email);
        showToast("Password reset email sent!");
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') showToast("Email already exists. Please log in.", 'warning');
      else if (err.code === 'auth/wrong-password') showToast("Incorrect password. Please try again.", 'error');
      else if (err.code === 'auth/user-not-found') showToast("User not found. Please register.", 'error');
      else showToast("Authentication error: " + err.message, 'error');
    }
  });
}
