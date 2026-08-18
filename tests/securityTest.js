module.exports = {
  'Protected Route Security Test': function(browser) {
    browser
      // Attempt to bypass login and hit the Admin Dashboard directly
      .url('http://127.0.0.1:8080/src/pages/manageuser/adminhome.html')
      .waitForElementVisible('body', 1000)
      
      // Since the user is NOT logged in, the auth listener should kick them out
      // Verify that the URL is forced back to the login page
      .pause(2000) // Give Firebase auth time to resolve
      .assert.urlContains('/auth/login.html')
      .assert.titleContains('Login')
      
      .end();
  }
};
