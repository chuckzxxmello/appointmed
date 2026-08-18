module.exports = {
  'Public Homepage & SEO Validation Test': function(browser) {
    browser
      // 1. Load the public homepage
      .url('http://127.0.0.1:8080/index.html')
      .waitForElementVisible('body', 2000)
      
      // 2. Validate SEO Meta Tags
      .assert.titleContains('ELAD School')
      .verify.elementPresent('meta[name="description"]')
      
      // 3. Verify Critical Public UI Elements
      .verify.elementPresent('header') // Navigation bar exists
      .verify.elementPresent('.hero-wrapper') // Hero section exists
      .verify.elementPresent('footer') // Footer exists
      
      // 4. Verify Call-to-Action (CTA) redirects to Login
      .click('a[href*="login.html"], button[onclick*="login.html"]')
      .waitForElementVisible('input[name="email"]', 3000)
      .assert.urlContains('/auth/login.html')
      
      .end();
  }
};
