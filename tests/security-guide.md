# Security & Abuse Prevention Guide

This document outlines the security architecture of the AppointMED system, specifically designed to protect against malicious actors, payload bloat, and "unconventional usage" that could exhaust Firebase quotas.

## Frontend Boundary Hardening

All user-facing forms have strict boundary constraints enforced at the HTML level using the `maxlength` property. This prevents users from pasting massive payloads (e.g., millions of characters) into simple text fields, which would freeze the browser and attempt to upload bloated data.

- **Names / Doctor Names:** 50 characters max
- **Emails:** 100 characters max
- **Phone Numbers:** 15 characters max
- **Facebook Links:** 50 characters max
- **Addresses:** 150 characters max

_**Note:** While frontend boundaries improve UX and stop casual abuse, they can be bypassed by malicious actors using DevTools or API clients. Therefore, they are backed up by strict backend rules._

## Backend Security (Firestore Rules)

The `firestore.rules` file is the definitive authority for all database operations. It acts as an API Gateway that rejects any request failing validation.

### A. Resource Exhaustion Prevention (Quota Protection)
Even if a user bypasses the frontend, the backend will reject writes where string payloads exceed their designated sizes:
```javascript
function isValidString(text, maxLength) {
  return text == null || (text is string && text.size() <= maxLength);
}
```

### B. Privilege Escalation Prevention
When a user creates an account, they cannot inject an `admin` role into the payload. The rules explicitly check that new accounts default to `patient` (or reject the write if `role: 'admin'` is attempted).

### C. Role-Based Access Control (RBAC) & Ownership
- **Patients:** Can strictly only read and write their own `/users/` document and their own `/appointments/`. They cannot query the entire database or access another patient's medical records.
- **Admins:** Can read and write globally. Admin authority is verified per-request using a database lookup:
```javascript
get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
```

## CI/CD Automated Security Testing

AppointMED utilizes GitHub Actions (`.github/workflows/ci.yml`) to ensure that every push to the `master` branch is automatically tested using **Nightwatch.js** in a headless environment before deployment.

### How it works:
1. GitHub provisions an Ubuntu server.
2. The server installs the project dependencies (`yarn install`).
3. The server starts the application locally (`live-server`).
4. Nightwatch opens a headless Chrome browser and simulates user interaction (e.g., Login flows) to ensure no regressions have broken the core functionality.

## Manual Red-Team Testing Protocol
To verify these protections, developers should attempt the following "Red-Team" tests:
1. **The Payload Attack:** Open DevTools on the Set Appointment modal, remove the `maxlength` attribute from the First Name field, paste 5,000 characters, and click Save. 
   - *Expected Result:* The Firebase SDK will throw a `permission-denied` error because the backend `firestore.rules` blocks the oversized payload.
2. **The Escalation Attack:** Using Postman or the browser console, attempt to `updateDoc` your own user document and set `{ role: "admin" }`.
   - *Expected Result:* The backend will reject the write because `role == resource.data.role` is enforced for non-admins.
