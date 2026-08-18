module.exports = {
  'Test Login Page Rendering and Validation': function(browser) {
    browser
      .url('http://127.0.0.1:5500/src/pages/auth/login.html')
      .waitForElementVisible('body', 1000)
      
      // Verify all elements loaded
      .waitForElementVisible('input[name="email"]', 5000)
      .waitForElementVisible('input[name="password"]', 5000)
      .assert.titleContains('Login')

      // Test invalid login to ensure Firebase Auth connection is working without relying on database state
      .setValue('input[name="email"]', 'fake_ci_test_user@example.com')
      .setValue('input[name="password"]', 'WrongPassword123!')
      
      // Submit the form
      .click('button[type="submit"]')
      
      // Wait for the Firebase Auth error message to appear in the DOM
      .waitForElementVisible('#message', 10000)
      
      // Verify that the error message indicates invalid credentials
      .assert.textContains('#message', 'Invalid email or password')
      
      .end();
  }
};
