import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { showToast } from "./ui-utils.js";

document.addEventListener("DOMContentLoaded", () => {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const emailInput = document.getElementById("reset-email");
    const messageDiv = document.getElementById("message");
    const loadingSpinner = document.getElementById("loadingSpinner");
    const submitBtn = document.getElementById("submitReset");

    if (!forgotPasswordForm) return;

    forgotPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Reset state
        messageDiv.textContent = "";
        messageDiv.className = "error-message";
        
        const email = emailInput.value.trim();
        
        if (!email) {
            showMessage("Please enter your registered email address.", "error");
            return;
        }

        // Empathetic 60-second cooldown to prevent spamming
        const lastSent = localStorage.getItem('lastResetRequestTime');
        const now = Date.now();
        if (lastSent && (now - parseInt(lastSent)) < 60000) {
            const remaining = Math.ceil((60000 - (now - parseInt(lastSent))) / 1000);
            showMessage(`For your security, please wait ${remaining} seconds before requesting another reset link.`, "error");
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.textContent = 'Sending...';
        loadingSpinner.classList.remove('hidden');

        try {
            // Send the Firebase Auth password reset email
            await sendPasswordResetEmail(auth, email);
            localStorage.setItem('lastResetRequestTime', Date.now().toString());
            
            // Show success message
            showMessage(`Success! A password reset link has been sent to ${email}. Please check your inbox and spam/junk folder. (Tip for Gmail users: look in the "Spam" folder on the left sidebar, or search "in:spam").`, "success");
            
            // Reset the form
            forgotPasswordForm.reset();
        } catch (error) {
            console.error("Password reset error:", error);
            
            let errorMessage = "Failed to send reset email. Please try again later.";
            
            // Handle specific Firebase error codes
            if (error.code === 'auth/user-not-found') {
                errorMessage = "No account found with this email address.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Please enter a valid email address format.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Too many attempts. Please try again later.";
            }
            
            showMessage(errorMessage, "error");
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.textContent = 'Send Reset Link';
            loadingSpinner.classList.add('hidden');
        }
    });

    function showMessage(msg, type) {
        messageDiv.textContent = msg;
        messageDiv.className = type === "error" ? "error-message" : "success-message";
        
        if (type === "success") {
            messageDiv.style.color = "#15803d";
            messageDiv.style.backgroundColor = "#f0fdf4";
            messageDiv.style.border = "1px solid #bbf7d0";
            messageDiv.style.padding = "0.75rem";
            messageDiv.style.borderRadius = "0.5rem";
            messageDiv.style.marginTop = "1rem";
        } else {
            messageDiv.style.color = "#b91c1c";
            messageDiv.style.backgroundColor = "#fef2f2";
            messageDiv.style.border = "none";
            messageDiv.style.padding = "0";
            messageDiv.style.marginTop = "0";
        }
    }
});
