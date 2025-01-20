module.exports = {
  'Test Login Page': function(browser) {
    // Open the login page
    browser
      .url('http://127.0.0.1:5500/src/pages/auth/login.html')
      .waitForElementVisible('body', 1000) // Ensure the page body is visible

      // Wait for the email and password input fields to be visible
      .waitForElementVisible('input[name="email"]', 5000)
      .waitForElementVisible('input[name="password"]', 5000)

      // Assert the page title contains 'Login'
      .assert.titleContains('Login')

      // Fill in the login form
      .setValue('input[name="email"]', 'benrick.tasic@testmail.com')
      .setValue('input[name="password"]', 'benrick123')

      // Submit the form
      .click('button[type="submit"]')

      // Wait for some time after submitting
      .pause(1000)

      // Assert that the user is redirected to the correct URL after login
      .assert.urlContains('userprofile')

      // End the session
      .end();
  }
};
