# AppointMED End-to-End Integration Testing

This guide focuses on full user-journey testing, ensuring that different modules (Auth, Admin, Patient, Database) communicate seamlessly with each other.

---

## Scenario 1: Full Patient Onboarding & Booking Cycle

**Objective:** Simulate a completely new patient joining the clinic and securing an appointment.

### Step 1: Registration
1. Navigate to the login page and register a new patient (`journey.test@example.com`).
2. Verify the account is created and the user lands on the unverified Patient Profile.

### Step 2: Verification (Simulated)
1. Open a new window (Incognito) and sign in as the **Admin**.
2. Navigate to "Manage Users".
3. Find the newly created patient (`journey.test@example.com`).
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

---

## Scenario 2: Clinic Operations & Status Updates

**Objective:** Ensure appointment lifecycles sync correctly and cascading deletions trigger properly.

### Step 1: Status Progression
1. As the **Admin**, click on the patient's appointment from Scenario 1.
2. Change the status from "Pending" to "Confirmed" and save.
3. Verify the appointment pill color changes from yellow/orange to green.

### Step 2: Patient Observation
1. As the **Patient**, verify the appointment status instantly updates to "Confirmed" on their dashboard (thanks to Firestore `onSnapshot`).

### Step 3: Session Completion & Cleanup
1. As the **Admin**, edit the appointment and change the status to "Completed".
2. As the **Admin**, navigate to "Manage Users", select the patient, and click "Delete".
3. Verify the user is removed from the table.
4. Navigate back to the Calendar. Verify the "Completed" appointment pill is also deleted (Cascading Deletion).
