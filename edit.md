# AppointMED Development Edit Logs

This document tracks all design decisions, architectural updates, bug fixes, UI enhancements, and Firestore real-time integration steps implemented across the AppointMED web application.

---

## 1. Authentication & Role-Based Navigation Routing

### Files Modified / Created
- [src/scripts/auth.js](file:///c:/projects/appointmed/src/scripts/auth.js)
- [src/scripts/admin-shared.js](file:///c:/projects/appointmed/src/scripts/admin-shared.js)
- [src/pages/auth/login.html](file:///c:/projects/appointmed/src/pages/auth/login.html)

### Key Improvements & Fixes
- **Auth Redirect Loop Resolution**: Refactored `onAuthStateChanged` in `auth.js` to execute automatic role-based redirection ONLY when the browser is actively on `login.html` (`window.location.pathname.includes('login.html')`). This fixed infinite redirect loops when accessing admin pages directly.
- **Absolute Redirection Enforcement**: Standardized login success redirects to use absolute origin URLs (`window.location.origin + '/src/pages/manageuser/adminhome.html'`).
- **Shared Navigation & Admin Profile Modal**: Created `admin-shared.js` to mount unified admin header components, profile edit modals, and universal Sign Out handlers across all admin panels.
- **Firestore Security Rules User Deletion Fix**:
  - Restored `allow delete: if isOwner(userId) || isAdmin();` for `match /users/{userId}` in [firestore.rules](file:///c:/projects/appointmed/firestore.rules).
  - Explicitly grants signed-in patients permission to delete their own profile document (`isOwner(userId)`), fixing a silent permission rejection bug where account deletion was blocked by Firestore security rules.

- **Resilient Patient Account Deletion**:
  - Updated `purgeUserDataCompletely` in [userprofile.js](file:///c:/projects/appointmed/src/scripts/userprofile.js) to execute direct, individual `deleteDoc(doc(db, 'users', userUid))` and appointment document deletions.
  - Ensures a patient's document and owned appointments are cleanly wiped out from Firestore before calling `currentUser.delete()`, without risk of batch permission errors.
- **Profile Form Persistence Fix**: Ensured `setDoc(userDocRef, data, { merge: true })` includes `uid` and `email` attributes to comply with Firestore security rules (`allow update: if isOwner(userId) || isAdmin();` / `allow create: if isSignedIn();`), enabling seamless profile saving.

---

## 2. Cloud Firestore Security Rules Configuration

### Files Modified
- [firestore.rules](file:///c:/projects/appointmed/firestore.rules)

### Key Improvements & Fixes
- **Declarative Access Rules**: Configured security rules for `users`, `appointments`, and `announcements` collections.
- **Role Verification Helpers**:
  - `isSignedIn()`: Verifies request authentication state.
  - `isOwner(userId)`: Restricts personal profile reads/updates/deletions to the resource owner.
  - `isAdmin()`: Validates whether `request.auth.uid` possesses `role == 'admin'` in the `users` collection.
- **Self-Service Deletion**: Added `allow delete: if isOwner(userId) || isAdmin();` to allow users to permanently delete their own profile document.

---

## 3. Appointment Management & Calendar Synchronization

### Files Modified
- [src/pages/manageuser/setappoint.html](file:///c:/projects/appointmed/src/pages/manageuser/setappoint.html)
- [src/scripts/setappoint.js](file:///c:/projects/appointmed/src/scripts/setappoint.js)
- [src/pages/calendar/calendaredit.html](file:///c:/projects/appointmed/src/pages/calendar/calendaredit.html)
- [src/scripts/calendaredit.js](file:///c:/projects/appointmed/src/scripts/calendaredit.js)

### Key Improvements & Fixes
- **DOM Selector Alignment**: Resolved a critical ID mismatch between `setappoint.html` (`<tbody id="apptsTableBody">`) and `setappoint.js` (`document.getElementById('appointmentsTbody')`). Standardized DOM element IDs (`apptsTableBody`, `addApptBtn`, `closeApptModalBtn`, `cancelApptModalBtn`, `apptModalFirstName`, `apptModalLastName`, `apptModalEmail`, `apptModalDate`, `apptModalStart`, `apptModalEnd`, `apptModalType`, `apptModalDoctor`, `apptModalStatus`) to eliminate silent null returns and render appointments immediately.
- **Email Verification & Account Deletion Fixes**:
  - **Firestore Email Verification Sync**: Fixed a bug where users who verified their email via the link were still shown as `verified: false` in Firestore. The system now syncs the Firebase Auth verification status back to Firestore automatically upon reload, unless the user was explicitly unverified by an admin.
  - **Google Sign-in Auto-Verification**: Google accounts are natively verified by Google. Updated `auth.js` to respect Google's verification status instead of forcing `emailVerified: false`, which caused an impossible state where Google users were unverified in Firestore but couldn't verify themselves because Firebase Auth already considered them verified.
  - **Clean Data Wipeout on Profile Deletion**: Enhanced `userprofile.js` and `firestore.rules`. When a patient permanently deletes their account, the system now safely purges all matching user documents (including fragments matching their email) and all owned appointments to ensure no remnants are left behind in the database. (`maxlength="20"`).
  - **ReferenceError & Startup Hydration Fix**: Fixed an uncaught `ReferenceError: setupFacebookInput is not defined` bug during module initialization by embedding the full `setupFacebookInput` definition in `calendaredit.js` and invoking `renderCalendar()` immediately at startup. This ensures the calendar grid (Month/Week/Day) renders instantly on page load and client lists load seamlessly.
  - **Interactive Facebook Link & Clear Button**: When typing or pasting a Facebook URL (`https://facebook.com/...`), an interactive link pill badge appears with an **X** button on the right, allowing the admin to clear the field with one click and set a new link or plain text name.
  - **Duplicate Button Cleanup**: Removed the redundant `+ Add` button from the "Drag to Schedule" sidebar section, leaving the single primary `Add Appointment` button in the top page header.
  - **Details & Table Display**: Display phone number and clickable Facebook links/names directly inside the Selected Date Details sidebar card and Appointment Management table.
- **Drag-and-Drop Real-Time Sync**: Updated drag-and-drop handlers so dragging a patient card onto a date/hour cell instantly creates and persists an appointment document in Cloud Firestore.
- **Preset Data Purge (Pre-Load Flash Prevention)**: Replaced hardcoded preset stats in HTML files with `0` to prevent visual flashing of invalid numbers before live Firestore data finishes fetching.

---

## 4. Patient Profile & Account Self-Service

### Files Modified
- [src/pages/auth/userprofile.html](file:///c:/projects/appointmed/src/pages/auth/userprofile.html)
- [src/scripts/userprofile.js](file:///c:/projects/appointmed/src/scripts/userprofile.js)

### Key Improvements & Fixes
- **Profile Update Form Fix**: Fixed DOM ID mismatch (`userProfileForm` -> `profileForm`) that prevented form submit events from firing. Personal details (First Name, Last Name, Middle Name, Phone, Age, Address) now save directly to Firestore.
- **Dynamic Member Since Timestamp**: Added fallback to `user.metadata.creationTime` from Firebase Auth if the Firestore `createdAt` timestamp is not yet populated.
- **Email Verification Flow**:
  - Added `user.reload()` on auth state change to update `user.emailVerified` status after verification link click.
  - Updated both dropdown menu and profile card badges (`emailVerifiedBadge`, `profileVerifiedStatus`) to display `Verified Account` vs `Unverified Account`.
  - Provided clear user messaging for verification link resends and rate limits.
- **Permanent Account Deletion (Danger Zone)**:
  - Added "Danger Zone" card and confirmation modal in Profile Settings.
  - Deletes user's appointments from Firestore `appointments` collection.
  - Deletes user's document from Firestore `users` collection.
  - Deletes Firebase Auth user account via `user.delete()`.
  - Handles `auth/requires-recent-login` by prompting for password re-authentication before completing deletion.

---

## 5. Real-Time Telemetry & Developer Analytics Toggle

### Files Modified
- [src/pages/manageuser/adminhome.html](file:///c:/projects/appointmed/src/pages/manageuser/adminhome.html)
- [src/scripts/adminhome.js](file:///c:/projects/appointmed/src/scripts/adminhome.js)
- [src/scripts/analytics.js](file:///c:/projects/appointmed/src/scripts/analytics.js)
- [src/scripts/dev-analytics.js](file:///c:/projects/appointmed/src/scripts/dev-analytics.js)

### Key Improvements & Fixes
- **Developer Analytics Toggle**: Placed inside the **Edit Admin Profile** modal window at the bottom in [admin-shared.js](file:///c:/projects/appointmed/src/scripts/admin-shared.js). Allows administrators to show or hide the Developer Analytics button. Hidden and turned OFF by default unless toggled ON. Preference is saved per-admin-user in Firestore (`users/{uid}/showDevAnalytics`).
- **Live Telemetry Engine**: Replaced static text and mock data across all analytics views with live Firestore snapshot computations (Peak booking hours, top service, attendance rate, average duration, query latency measured via `performance.now()`).

---

## 6. Modern UI & CSS Design System Upgrades

### Files Modified
- [src/styles/admin.css](file:///c:/projects/appointmed/src/styles/admin.css)
- [src/styles/userprofile.css](file:///c:/projects/appointmed/src/styles/userprofile.css)

### Key Improvements & Fixes
- **Status Badge Styling**: Created rounded status pills (`.status-badge`, `.status-pill`) with high-contrast color palettes:
  - **Pending**: Soft amber background (`#fef3c7`), dark amber text (`#b45309`).
  - **Confirmed / Verified**: Emerald green background (`#dcfce7`), emerald text (`#15803d`).
  - **Completed**: Medical blue background (`#e0f2fe`), blue text (`#0369a1`).
  - **Cancelled / Danger**: Crimson red background (`#fee2e2`), red text (`#b91c1c`).
- **Interactive Buttons**: Enhanced action buttons with smooth hover micro-elevations (`transform: translateY(-1px)`).
