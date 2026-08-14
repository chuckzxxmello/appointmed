# AppointMED Quality Assurance & Manual Testing Guide

This document provides a comprehensive, step-by-step Quality Assurance (QA) manual testing script for validating all functional, security, performance, and accessibility features across the AppointMED platform before production deployment.

---

## 1. Pre-Test Setup Checklist

1. **Local Server Running**: Start a local web server (e.g. `npx http-server . -p 8080`).
2. **Clean Browser Session**: Open Google Chrome / Brave / Edge in an **Incognito / Private Window** or open DevTools (`F12`) -> Application -> Storage -> **Clear site data**.
3. **Network Connection**: Ensure internet connectivity for Firebase Firestore & Firebase Auth access.

---

## 2. Test Suite 1: Authentication & Security Controls

### Test Case 1.1: Patient Registration & Initial Verification State
* **Objective:** Verify new patient accounts are created with unverified status and verification email sent.
* **Steps:**
  1. Navigate to `/src/pages/auth/login.html`.
  2. Click **"Create Account"** or the signup toggle button.
  3. Enter a valid email (`patient.test@example.com`) and a secure password.
  4. Submit the form.
* **Expected Result:**
  - Registration succeeds without errors.
  - Browser automatically redirects to `/src/pages/auth/userprofile.html`.
  - User profile displays an **"Unverified Account"** warning badge.
  - A verification email is dispatched to the user's inbox.

---

### Test Case 1.2: Empathetic Login Rate-Limiter (Brute-Force Protection)
* **Objective:** Verify that 3 consecutive failed login attempts trigger an empathetic 30-second security timeout.
* **Steps:**
  1. Navigate to `/src/pages/auth/login.html`.
  2. Enter any email and an **incorrect password**. Click **Sign In**.
  3. Repeat step 2 three (3) consecutive times.
* **Expected Result:**
  - Attempts 1 & 2: Error message displays remaining attempts (*"Invalid email or password. (X attempts remaining before brief timeout)"*).
  - Attempt 3: Message turns warm amber/red stating: *"Too many failed attempts."* / *"For your security, please wait 30 seconds before trying again."*
  - Subsequent submissions during the 30-second window are blocked locally without making unnecessary network requests.

---

### Test Case 1.3: Password Reset Rate Limiting
* **Objective:** Verify password reset link requests are throttled with a 60-second cooldown.
* **Steps:**
  1. Navigate to `/src/pages/auth/forgotpassword.html`.
  2. Enter a registered email address and click **"Send Reset Link"**.
  3. Immediately click **"Send Reset Link"** a second time.
* **Expected Result:**
  - 1st Request: Success message displayed explaining that the reset link was sent (with tips for Gmail spam folders).
  - 2nd Request: System displays a warning: *"For your security, please wait X seconds before requesting another reset link."*

---

### Test Case 1.4: Mandatory Re-Authentication on Permanent Account Deletion
* **Objective:** Verify that account deletion requires password verification and completely purges all Firestore records.
* **Steps:**
  1. Sign in as a patient and navigate to `/src/pages/auth/userprofile.html`.
  2. Scroll down to the **"Danger Zone"** section and click **"Delete My Account"**.
  3. The deletion confirmation modal appears.
  4. Leave the password field blank and click **"Yes, Delete Everything"**.
  5. Enter an incorrect password and submit.
  6. Enter the correct password and submit.
* **Expected Result:**
  - Step 4: Red inline warning prompts *"Please enter your password to confirm deletion."*
  - Step 5: Red inline warning states *"Incorrect password. Please try again."*
  - Step 6: Security credentials verified -> All user profile documents and owned appointment documents are deleted from Firestore -> Auth account deleted -> Redirected to login page with a success toast.

---

## 3. Test Suite 2: Interactive Calendar & Appointment Matrix

### Test Case 2.1: Uniform 140px Calendar Grid & Visual Balance
* **Objective:** Verify all calendar grid cells maintain strict mathematical height uniformity.
* **Steps:**
  1. Sign in as an Admin (`/src/pages/manageuser/adminhome.html`).
  2. Open the Calendar page (`/src/pages/calendar/calendaredit.html`).
  3. Inspect days with 0 appointments, 1 appointment, and 4+ appointments.
* **Expected Result:**
  - All calendar rows remain exactly `140px` in height.
  - Days with 4+ appointments display up to 3 colored pills followed by a clean `+X more...` button.
  - No pills or buttons bleed over or overlap into lower weeks/rows.

---

### Test Case 2.2: Day Appointments Modal & Direct Actions
* **Objective:** Verify clicking a date cell or `+X more...` button opens the unified modal with full CRUD capabilities.
* **Steps:**
  1. Click on a day cell with multiple appointments or click the `+X more...` button.
  2. Inspect the opened modal.
  3. Click the **`+ Add`** button in the modal header.
  4. Click the **`Edit`** button on an appointment item.
  5. Click the **`Delete`** button on an appointment item.
  6. Press the **`Escape`** key on your keyboard.
* **Expected Result:**
  - Modal smoothly overlays the screen with a dimmed backdrop.
  - Step 3: Opens the Schedule modal pre-filled with the selected date.
  - Step 4: Opens the Edit Appointment modal pre-filled with that appointment's details.
  - Step 5: Prompts for confirmation and deletes the appointment, instantly refreshing the modal list in real-time.
  - Step 6: Instantly closes the modal.

---

### Test Case 2.3: Single Pill Direct Edit Trigger
* **Objective:** Verify clicking an individual appointment pill immediately opens the Edit modal.
* **Steps:**
  1. Click directly on any colored appointment pill on the calendar grid.
* **Expected Result:**
  - The **Edit Appointment** modal instantly opens with patient name, therapy service, doctor, and date/time pre-loaded.

---

### Test Case 2.4: Interactive Drag-and-Drop Scheduling
* **Objective:** Verify dragging an unverified/verified client card onto a date cell schedules an appointment interactively.
* **Steps:**
  1. Locate a patient in the **"Drag to Schedule"** sidebar widget.
  2. Drag the client card and drop it onto a date cell on the calendar (Month/Week view) or a specific time slot (Day view).
* **Expected Result:**
  - The cell highlights on hover (`drag-over` effect).
  - On drop, the **Schedule Appointment modal** instantly opens.
  - The modal is pre-populated with the patient's Name, Email, Phone Number, and Facebook Link (if available).
  - If dropped on a Day view time slot, the Start and End times are automatically set.

---

### Test Case 2.5: Messenger-Style Drag-to-Delete
* **Objective:** Verify that dragging an existing appointment pill to the bottom trash zone prompts a deletion sequence.
* **Steps:**
  1. Click and drag an existing `.cal-evt-pill` (colored appointment block) on the calendar.
  2. A red **"Drop here to delete"** zone should slide up from the bottom of the screen.
  3. Drop the pill into the red zone.
  4. Press the `Esc` key on the keyboard.
  5. Drag the pill again and drop it into the red zone.
  6. Click **"Yes, Delete"**.
* **Expected Result:**
  - Step 2: The delete zone appears with a smooth transition.
  - Step 3: A confirmation modal ("Delete Appointment?") appears.
  - Step 4: The modal instantly closes, aborting the deletion.
  - Step 6: The appointment is successfully deleted from Firestore and removed from the calendar.

---

## 4. Test Suite 3: Admin User Management & Bulk Operations

### Test Case 3.1: Last Admin Account Protection Guard
* **Objective:** Verify the system prevents accidental deletion of the last remaining administrator.
* **Steps:**
  1. Navigate to `/src/pages/manageuser/manageusers.html`.
  2. Locate the primary admin account row.
* **Expected Result:**
  - The delete icon is disabled with reduced opacity (`cursor: not-allowed`).
  - Hover tooltip displays: *"Action Prohibited: Cannot delete the last remaining admin account"*.

---

### Test Case 3.2: Instant Bulk User Deletion (Parallel Processing)
* **Objective:** Verify bulk user deletion executes in parallel without UI lag.
* **Steps:**
  1. In `/src/pages/manageuser/manageusers.html`, check the **"Select All"** checkbox in the table header (or check multiple test patient rows).
  2. Click the red **"Delete (X)"** button.
  3. Confirm the dialog prompt.
* **Expected Result:**
  - The system executes parallel batch deletions using `Promise.all` and chunked writes.
  - Associated appointments for the deleted users are simultaneously purged.
  - Table instantly updates in real-time.
  - Toast notification confirms: *"Successfully deleted X users."*

---

## 5. Test Suite 4: Patient Portal & Dynamic Announcements

### Test Case 4.1: Live Announcements Broadcast
* **Objective:** Verify admin announcements appear in real-time on patient dashboards.
* **Steps:**
  1. As Admin, navigate to `/src/pages/manageuser/adminhome.html`.
  2. Publish a clinic announcement alert.
  3. In another browser tab/window signed in as a Patient (`userprofile.html`), observe the dashboard.
* **Expected Result:**
  - The alert appears instantly on the patient portal without requiring a page reload.

---

### Test Case 4.2: Patient Read-Only Calendar
* **Objective:** Verify patient calendar displays appointments with privacy preservation.
* **Steps:**
  1. In `userprofile.html`, navigate to the calendar section.
  2. Click a date cell.
* **Expected Result:**
  - Read-only schedule modal opens showing appointment time slots without exposing other patients' confidential private information.

---

## 6. Test Suite 5: Telemetry & Developer Analytics

### Test Case 5.1: Developer Analytics Toggle
* **Objective:** Verify the Developer Analytics button is hidden by default and can be toggled on per-admin.
* **Steps:**
  1. In `/src/pages/manageuser/adminhome.html`, click the admin profile icon -> **"Edit Admin Profile"**.
  2. Toggle **"Show Developer Analytics"** ON and click **"Save Profile"**.
  3. Observe the admin dashboard.
* **Expected Result:**
  - The **"Developer Analytics"** card/button appears on the dashboard.
  - Clicking it navigates to `dev-analytics.html` showing live query latency benchmarks.
