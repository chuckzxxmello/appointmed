// handler user logged-in
const userLoggedIn = (user) => {
    // Remove form container if the user is logged in
    formContainer.remove();
    $('#auth-container').removeClass('d-none');
    
    // Display user info (email and email verification status)
    authText.innerText = `You are Logged In as ${user.email}\nVerified: ${user.emailVerified}`;
    
    // Show/hide verify email button based on email verification status
    if (user.emailVerified) {
        verifyEmailBtn.classList.add('d-none');
    } else {
        verifyEmailBtn.classList.remove('d-none');
    }
};

// handle user logged-out
const userLoggedOut = () => {
    // Append the form container back to the body
    $('body')[0].append(formContainer);
    
    // Hide the auth container
    $('#auth-container')[0].classList.add('d-none');
};

// error handler
const errorHandler = (err, isInfo = false) => {
    // Display info or error message
    if (isInfo) {
        $('#error-heading')[0].innerText = "Info";
    } else {
        $('#error-heading')[0].innerText = "Error";
    }
    
    // Display the error message
    $('#error-msg')[0].innerText = err.message;
    
    // Show the modal with error or info message
    errorModal.modal('show');
};
