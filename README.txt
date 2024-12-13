appointment-scheduling-system
codebreaker

**directoy details**

1. Root Folder
package.json: For Node.js projects, contains dependencies and scripts.

2. src (or app)

a. Scripts
/scripts: Utility scripts for tasks like migrations or data seeding.
b. Pages
/pages: Main pages of your application (e.g., Home, Schedule, Profile).
c. Styles
/styles: Global styles, themes, or CSS modules.
d. Assets
/assets: Images, icons, fonts, etc.
8. Documentation
/docs:

Progress

I. FRONT-END

MODULE PAGES

-> index.html  = main homepage
-> contact.html  = contact us page

USER PAGES

-> userprofile.html  = user's homepage
-> userappointmentcheckstatus.html = views appointment status
-> viewtransactions.html = views recent transactions


ADMIN PAGES

-> adminhome.html  = admin's homepage
-> editadmininfo.html = edit default admin's authentication e-mail & password
-> edituserprofile.html = edituserprofile.html
-> manageusers.html = views users from the authentication and firestore database
-> viewtransactions.html = views recent transactions

CALENDAR PAGES

-> calendar.html = user view calendar appointments
-> editcalendar.html = admin view/edit calendar appointments

note: every updates of every html  we create we put it into a developers logs folder to handle the version updates of the page so 


II. FIREBASE, FIRESTORE DATABASE, AND NODEJS INITIALIZATION

-> installing nodejs for back-end javascript functionality
-> creation firebase console: appointment-scheduling-system
-> installing firebase CLI in vscode
-> adding firebase SDK configuration in websites
-> initialization of firebase authentication
-> initialization of firebase firestore noSQL database

III. BACK-END

LOGIN FORM
-> firebaseConfig.js = initialized firebase config
-> auth.js = login/signup
-> googleAuth.js = login/signup with google
-> login.js = login/logout session

REAL-TIME CALENDAR
...

ADMIN EDIT USERS...
ADMIN EDIT REAL-TIME CALENDAR...
ADMIN EDIT TRANSACTIONS...