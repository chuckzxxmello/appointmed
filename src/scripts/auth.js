import { auth, db } from './firebase-config.js';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    setPersistence,
    browserLocalPersistence,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Ensure Local Session Persistence Across Page Refreshes & Navigations
setPersistence(auth, browserLocalPersistence).catch(err => {
    console.log("Auth session persistence notice:", err);
});

function redirectUserByRole(isAdmin) {
    const targetUrl = isAdmin
        ? window.location.origin + '/src/pages/manageuser/adminhome.html'
        : window.location.origin + '/src/pages/auth/userprofile.html';

    if (window.location.href !== targetUrl) {
        window.location.href = targetUrl;
    }
}

// Auto-Redirect Logged In Session ONLY when on login page to prevent redirect loops
onAuthStateChanged(auth, async (user) => {
    if (user && window.location.pathname.includes('login.html')) {
        let isAdmin = false;
        try {
            const userDocSnap = await getDoc(doc(db, 'users', user.uid));
            if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
                isAdmin = true;
            }
        } catch (err) {
            console.log("Auth session role check notice:", err);
        }

        if (!isAdmin && user.email && user.email.toLowerCase().includes('admin')) {
            isAdmin = true;
        }

        redirectUserByRole(isAdmin);
    }
});

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const loginContainer = document.querySelector('.login-container');
    const signupContainer = document.querySelector('.signup-container');

    const loginForm = document.getElementById('auth');
    const createAccountForm = document.getElementById('createAccountForm');

    const switchToSignupBtn = document.getElementById('switchToSignup');
    const switchToLoginBtn = document.getElementById('switchToLogin');
    const googleLoginBtn = document.getElementById('googleLoginBtn');

    const loginSpinner = document.getElementById('loginSpinner');
    const signupSpinner = document.getElementById('signupSpinner');
    const loginMessage = document.getElementById('message');
    const signupMessage = document.getElementById('signup-message');

    // --- 1. Toggle Between Login & Signup Cards ---
    if (switchToSignupBtn && switchToLoginBtn) {
        switchToSignupBtn.addEventListener('click', () => {
            if (loginContainer) loginContainer.classList.add('hidden');
            if (signupContainer) signupContainer.classList.remove('hidden');
            clearMessages();
        });

        switchToLoginBtn.addEventListener('click', () => {
            if (signupContainer) signupContainer.classList.add('hidden');
            if (loginContainer) loginContainer.classList.remove('hidden');
            clearMessages();
        });
    }

    // --- 2. Toggle Password Visibility ---
    document.querySelectorAll('.btn-toggle-pass').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetInputId = e.target.id === 'show-hide-login-password' ? 'login-password' : 'signup-password';
            const passwordInput = document.getElementById(targetInputId);
            if (!passwordInput) return;

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                e.target.textContent = "Hide";
            } else {
                passwordInput.type = "password";
                e.target.textContent = "Show";
            }
        });
    });

    // --- 3. Handle Email/Password Login ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearMessages();

            const emailInput = document.getElementById('login-email');
            const passInput = document.getElementById('login-password');
            if (!emailInput || !passInput) return;

            const email = emailInput.value.trim();
            const password = passInput.value;

            // --- Security: Empathetic Login Cooldown ---
            const lockoutUntil = parseInt(localStorage.getItem('loginLockoutUntil') || '0');
            const now = Date.now();
            if (now < lockoutUntil) {
                const remaining = Math.ceil((lockoutUntil - now) / 1000);
                if (loginMessage) {
                    loginMessage.textContent = `Too many failed attempts.`;
                    loginMessage.style.color = '#b45309'; // warm warning color
                }
                return;
            }

            if (!email || !password) {
                if (loginMessage) loginMessage.textContent = "Please enter your email and password.";
                return;
            }

            setLoading(loginSpinner, true);

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Reset failed attempts on success
                localStorage.removeItem('failedLoginAttempts');
                localStorage.removeItem('loginLockoutUntil');

                // Always merge user document to Firestore on login
                let isAdmin = false;
                const userDocRef = doc(db, 'users', user.uid);
                try {
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        if (userDocSnap.data().role === 'admin') isAdmin = true;
                        // Merge last login timestamp
                        await setDoc(userDocRef, {
                            lastLoginAt: new Date().toISOString()
                        }, { merge: true });
                    } else {
                        // First time login (no Firestore doc yet) - create it with unverified status until link clicked
                        isAdmin = email.toLowerCase().includes('admin');
                        await setDoc(userDocRef, {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName || '',
                            role: isAdmin ? 'admin' : 'patient',
                            emailVerified: false,
                            createdAt: serverTimestamp(),
                            lastLoginAt: new Date().toISOString()
                        }, { merge: true });
                    }
                } catch (err) {
                    console.log("Firestore role fetch notice:", err);
                }

                if (!isAdmin && user.email && user.email.toLowerCase().includes('admin')) {
                    isAdmin = true;
                }

                redirectUserByRole(isAdmin);
            } catch (error) {
                console.error("Login error:", error);

                // Track failed attempts
                let attempts = parseInt(localStorage.getItem('failedLoginAttempts') || '0') + 1;
                localStorage.setItem('failedLoginAttempts', attempts.toString());

                if (attempts >= 3) {
                    // Empathetic 30-second lockout after 3 fails
                    localStorage.setItem('loginLockoutUntil', (Date.now() + 30000).toString());
                    localStorage.removeItem('failedLoginAttempts');
                }

                if (loginMessage) {
                    loginMessage.style.color = '#dc2626'; // default error red
                    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                        if (attempts >= 3) {
                            loginMessage.textContent = "Invalid credentials. For your security, please wait 30 seconds before trying again.";
                        } else {
                            const left = 3 - attempts;
                            loginMessage.textContent = `Invalid email or password. (${left} attempt${left === 1 ? '' : 's'} remaining before brief timeout)`;
                        }
                    } else if (error.code === 'auth/too-many-requests') {
                        loginMessage.textContent = "Account temporarily locked by server due to many failed attempts. Please reset your password or try later.";
                    } else {
                        loginMessage.textContent = `Login failed: ${error.message}`;
                    }
                }
            } finally {
                setLoading(loginSpinner, false);
            }
        });
    }

    // --- 4. Handle Account Registration ---
    if (createAccountForm) {
        createAccountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearMessages();

            const emailInput = document.getElementById('signup-email');
            const passInput = document.getElementById('signup-password');
            if (!emailInput || !passInput) return;

            const email = emailInput.value.trim();
            const password = passInput.value;

            setLoading(signupSpinner, true);

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const isAdmin = email.toLowerCase().includes('admin');

                // Send verification email to user inbox
                try {
                    await sendEmailVerification(user);
                } catch (vErr) {
                    console.warn("Could not send initial verification email:", vErr);
                }

                // Save profile to Firestore with explicit emailVerified: false for new email signups
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    role: isAdmin ? 'admin' : 'patient',
                    emailVerified: false,
                    createdAt: serverTimestamp()
                }, { merge: true });

                redirectUserByRole(isAdmin);
            } catch (error) {
                console.error("Signup error:", error);
                if (signupMessage) signupMessage.textContent = `Failed to create account: ${error.message}`;
            } finally {
                setLoading(signupSpinner, false);
            }
        });
    }

    // --- 5. Handle Google Sign-In ---
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            clearMessages();
            setLoading(loginSpinner, true);

            try {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                const user = result.user;

                const userDocRef = doc(db, 'users', user.uid);
                let isAdmin = false;

                try {
                    const userDocSnap = await getDoc(userDocRef);
                    const isNewUser = !userDocSnap.exists();

                    if (isNewUser) {
                        isAdmin = user.email && user.email.toLowerCase().includes('admin');
                    } else {
                        if (userDocSnap.data().role === 'admin') isAdmin = true;
                    }

                    // Always merge Google profile data (displayName, photoURL) on every login
                    const mergeData = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || '',
                        photoURL: user.photoURL || '',
                        lastLoginAt: new Date().toISOString()
                    };
                    if (isNewUser) {
                        mergeData.role = isAdmin ? 'admin' : 'patient';
                        mergeData.emailVerified = user.emailVerified;
                        mergeData.createdAt = serverTimestamp();
                        // Split displayName into firstName/lastName
                        if (user.displayName) {
                            const parts = user.displayName.split(' ');
                            mergeData.firstName = parts[0] || '';
                            mergeData.lastName = parts.slice(1).join(' ') || '';
                        }
                    }
                    await setDoc(userDocRef, mergeData, { merge: true });
                } catch (err) {
                    console.log("Google login Firestore check notice:", err);
                }

                if (!isAdmin && user.email && user.email.toLowerCase().includes('admin')) {
                    isAdmin = true;
                }

                redirectUserByRole(isAdmin);
            } catch (error) {
                console.error("Google login error:", error);
                if (loginMessage) loginMessage.textContent = `Google Sign-In failed: ${error.message}`;
            } finally {
                setLoading(loginSpinner, false);
            }
        });
    }

    // --- Helper Functions ---
    function setLoading(spinnerElement, isLoading) {
        if (spinnerElement) {
            if (isLoading) {
                spinnerElement.classList.remove('hidden');
            } else {
                spinnerElement.classList.add('hidden');
            }
        }
    }

    function clearMessages() {
        if (loginMessage) loginMessage.textContent = '';
        if (signupMessage) signupMessage.textContent = '';
    }
});