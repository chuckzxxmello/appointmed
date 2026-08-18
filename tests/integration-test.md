# End-to-End Integration Testing

This guide focuses on full user-journey testing, ensuring that different modules (Auth, Admin, Patient, Database) communicate seamlessly with each other.

## Scenario 1: Full Patient Onboarding & Booking Cycle

**TEST 1: Simulate a completely new patient joining the clinic and securing an appointment.**

### Step 1: Registration
1. Navigate to the login page and register a new patient (`user.test@example.com`).
2. Verify the account is created and the user lands on the unverified Patient Profile.

### Step 2: Verification (Simulated)
1. Open a new window (Incognito) and sign in as the **Admin**.
2. Navigate to "Manage Users".
3. Find the newly created patient (`user.test@example.com`).
4. Click the "Verify" checkmark icon to manually verify the patient.
5. In the Patient's window, refresh the page.
6. Verify the "Unverified" badge changes to a green "Verified" badge.

### Step 3: Admin Scheduling
1. As the **Admin**, navigate to the Calendar view.
2. Locate the patient in the "Drag to Schedule" sidebar.
3. Drag the patient onto tomorrow's date cell.
4. Fill out the "Add Appointment" modal (Service: Physical Therapy, Time: 10:00 AM) and Save.
5. Verify the appointment pill appears on the calendar.

### Step 4: Patient Visibility
1. Switch back to the **Patient** window.
2. Check the "My Appointments" or Calendar section.
3. Verify the newly scheduled Physical Therapy appointment is visible with a "Pending" status.

## Scenario 2: Clinic Operations & Status Updates

**TEST 2: Ensure appointment lifecycles sync correctly and cascading deletions trigger properly.**

### Step 1: Status Progression
1. As the **Admin**, click on the patient's appointment from Scenario 1.
2. Change the status from "Pending" to "Confirmed" and save.
3. Verify the appointment pill color changes from yellow/orange to green.

### Step 2: Patient Observation
1. As the **Patient**, verify the appointment status instantly updates to "Confirmed" on their dashboard.

### Step 3: Session Completion & Cleanup
1. As the **Admin**, edit the appointment and change the status to "Completed".
2. As the **Admin**, navigate to "Manage Users", select the patient, and click "Delete".
3. Verify the user is removed from the table.
4. Navigate back to the Calendar. Verify the "Completed" appointment pill is also deleted.

## Scenario 3: Global Announcements Sync

**TEST 3: Ensure clinic-wide announcements immediately propagate to all active clients.**

### Step 1: Broadcast Creation
1. As the **Admin**, navigate to the Admin Dashboard.
2. Under the "Portal Announcement" section, update the text to: `"Clinic will be closed for the holiday."` and click Save.
3. Verify a success notification appears.

### Step 2: Patient Broadcast Reception
1. Switch to the **Patient** window (or open a new window as a Patient).
2. Look at the top alert banner on the Patient Dashboard.
3. Verify the message exactly matches `"Clinic will be closed for the holiday."` without needing a page refresh (testing Firestore real-time listeners).

## Scenario 4: Analytics Dashboard Sync

**TEST 4: Verify that the Admin Dashboard's summary widgets accurately calculate totals in real-time.**

### Step 1: Baseline Check
1. As the **Admin**, log in and note the exact numbers on the dashboard widgets:
   - Total Users
   - Total Appointments
   - Pending Appointments

### Step 2: Data Injection
1. Navigate to the Calendar and create a new appointment for any patient with a "Pending" status.
2. Go back to the Admin Dashboard.
3. Verify that **Total Appointments** increased by exactly `1`.
4. Verify that **Pending Appointments** increased by exactly `1`.

### Step 3: Status Analytics
1. Go back to the Calendar and update that same appointment to "Confirmed".
2. Return to the Admin Dashboard.
3. Verify that **Total Appointments** remained the same, but **Pending Appointments** decreased by `1`.

## Scenario 5: Session & Route Protection

**TEST 5: Ensure users cannot bypass UI protections by directly typing URLs into the browser.**

### Step 1: Patient Bouncing
1. Log in as a **Patient**.
2. Manually type `.../src/pages/manageuser/adminhome.html` into the URL bar and hit enter.
3. Verify the system aggressively kicks the user back to `userprofile.html` or `login.html`.

### Step 2: Logged-Out Bouncing
1. Log completely out of the system.
2. Manually type `.../src/pages/manageuser/adminhome.html` into the URL bar and hit enter.
3. Verify the system instantly redirects to `login.html`.
