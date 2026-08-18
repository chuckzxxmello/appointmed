module.exports = {
  'Client-Side Form Validation Test': function(browser) {
    browser
      // 1. Load the login page
      .url('http://127.0.0.1:8080/src/pages/auth/login.html')
      .waitForElementVisible('body', 2000)
      
      // 2. Test empty form submission
      .click('button[type="submit"]')
      // HTML5 validation will trigger. Nightwatch can check the validity pseudo-class
      .assert.elementPresent('input[name="email"]:invalid')
      
      // 3. Test malformed email submission
      .setValue('input[name="email"]', 'not_an_email')
      .click('button[type="submit"]')
      .assert.elementPresent('input[name="email"]:invalid')
      
      // 4. Navigate to Forgot Password and test empty submission
      .url('http://127.0.0.1:8080/src/pages/auth/forgotpassword.html')
      .waitForElementVisible('body', 2000)
      .click('button[type="submit"]')
      .assert.elementPresent('input[type="email"]:invalid')
      
      .end();
  }
};
